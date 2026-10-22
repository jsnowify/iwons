"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Check, Circle, Download, Trash2, ShieldCheck, LogOut, Info, DatabaseBackup } from "lucide-react";
import { storage } from "@/lib/storage";
import { handleSchema } from "@/lib/accounts/contracts";
import { useHandleAvailability } from "@/lib/accounts/use-handle-availability";
import { useAccount, accountRequest } from "./account-provider";
import { Button, Modal, useToast } from "./ui";
import { SyncStatus } from "./sync-status";
import { AuthLink } from "./auth-link";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Shown once after the first sign-in on a device that has guest progress. */
export function AccountNotice() {
  const account = useAccount();
  const toast = useToast();
  if (!account.user || !account.hasImport) return null;
  const summary = account.importSummary;
  const parts = summary ? [summary.solves ? plural(summary.solves, "solved problem") : "", summary.drafts ? plural(summary.drafts, "draft") : "",
    summary.lessons ? `${plural(summary.lessons, "lesson step")} completed` : "", summary.preferences ? "your editor preferences" : ""].filter(Boolean) : [];
  return <div className="content"><section className="card import-card stack" aria-label="Optional device import">
    <div className="between import-head"><div>
      <div className="eyebrow">Optional · one step</div>
      <h2>Bring this device’s progress along?</h2></div>
      <DatabaseBackup size={22} aria-hidden="true" className="muted" /></div>
    {parts.length ? <p>We found <strong>{parts.join(", ")}</strong> saved as a guest on this device.</p> : <p>We found guest progress saved on this device.</p>}
    {summary?.skipped ? <small className="muted">{summary.skipped} {summary.skipped === 1 ? "item won’t" : "items won’t"} be imported (custom problems).</small> : null}
    <ul className="import-facts">
      <li><Check size={14} aria-hidden="true" />Imported solves appear in your progress right away.</li>
      <li><Info size={14} aria-hidden="true" />They don’t count toward the leaderboard until you solve them with the server judge.</li>
      <li><ShieldCheck size={14} aria-hidden="true" />Your guest copy stays on this device either way. Importing twice is safe; nothing doubles.</li>
    </ul>
    {account.importing ? <div className="stack import-progress" role="status">
      <span className="mono">Importing your progress…</span>
      <div className="progress-track judge-indeterminate" aria-hidden="true"><div className="progress-fill" /></div>
    </div> : null}
    <div className="row wrap">
      <Button loading={account.importing} onClick={() => void account.importDevice().then(() => {
        if (!storage.syncChoice(account.user!.id)) return;
        toast("Imported. Your progress is on your account now.");
      })}>Import device progress</Button>
      <Button variant="secondary" disabled={account.importing} onClick={account.skipImport}>Skip import</Button>
    </div>
    {account.error ? <p className="error-box" role="alert">{account.error} Nothing was lost — you can try again.</p> : null}
  </section></div>;
}

function suggestHandle(name: string, id: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 15);
  const suffix = id.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-4);
  for (const candidate of [base, `${base}_${suffix}`.slice(0, 20), `learner_${suffix}`])
    if (handleSchema.safeParse(candidate).success) return candidate;
  return "";
}
function handleRules(value: string) {
  return [
    { label: "3 to 20 characters", ok: value.length >= 3 && value.length <= 20 },
    { label: "Lowercase letters, numbers and _ only", ok: value.length > 0 && /^[a-z0-9_]+$/.test(value) },
  ];
}
type Saved = "" | "saving" | "saved" | string;
function SavedNote({ state }: { state: Saved }) {
  if (!state) return null;
  if (state === "saving") return <span className="saved-note muted" role="status">Saving…</span>;
  if (state === "saved") return <span className="saved-note success" role="status"><Check size={13} aria-hidden="true" />Saved</span>;
  return <span className="saved-note danger" role="alert">{state}</span>;
}

export function AccountPanel() {
  const account = useAccount();
  if (!account.credentialAccount && (account.user || account.providers.length > 0)) return <LegacyAccountPanel />;
  return <section className="settings-section" id="account" aria-label="Optional account">
    <div><h2>Your account</h2><p className="muted">Signing in is optional.</p></div>
    <div className="stack">
      {account.user ? <><p>Signed in as <strong>@{account.user.handle}</strong>.</p><Link className="text-link" href="/profile/">View your profile</Link></> :
        <><p>Create a free account to keep your progress on other devices. Your guest work stays on this device.</p><div className="row wrap"><AuthLink className="btn secondary" /><AuthLink signup className="btn secondary">Create account</AuthLink></div></>}
    </div>
  </section>;
}

function LegacyAccountPanel() {
  const account = useAccount();
  const user = account.user;
  const toast = useToast();
  const [handle, setHandle] = useState(""), [handleState, setHandleState] = useState<Saved>("");
  const [privacyState, setPrivacyState] = useState<Saved>(""), [optIn, setOptIn] = useState(false);
  const [exporting, setExporting] = useState(false), [exportError, setExportError] = useState("");
  const [deleting, setDeleting] = useState(false), [confirmation, setConfirmation] = useState(""), [removing, setRemoving] = useState(false), [deleteError, setDeleteError] = useState("");
  const handleHelp = useId();
  useEffect(() => { setHandle(user?.handle ?? ""); setOptIn(user?.leaderboardOptIn ?? false); }, [user?.handle, user?.leaderboardOptIn]);
  const suggestion = user && !user.handle ? suggestHandle(user.name, user.id) : "";
  const rules = handleRules(handle);
  const parsedHandle = handleSchema.safeParse(handle);
  const reservedWord = rules.every(rule => rule.ok) && !parsedHandle.success;
  const availability = useHandleAvailability(handle, user?.id);

  async function patch(body: Record<string, unknown>, set: (state: Saved) => void) {
    set("saving");
    try { await accountRequest("/api/me/", "PATCH", body); await account.refresh(); set("saved"); setTimeout(() => set(""), 2500); return true; }
    catch (cause) { set(cause instanceof Error ? cause.message : "That didn’t save. Please try again."); return false; }
  }
  async function exportData() {
    setExporting(true); setExportError("");
    try {
      const data = await accountRequest("/api/me/export/");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "Iwons-account-backup.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Your account data is downloading.");
    } catch (cause) { setExportError(cause instanceof Error ? cause.message : "Export could not finish. Please try again."); }
    finally { setExporting(false); }
  }
  async function removeAccount() {
    setRemoving(true); setDeleteError("");
    try {
      await accountRequest("/api/me/", "DELETE");
      storage.clear(); storage.syncPending(false); await account.logout();
    } catch (cause) { setDeleteError(cause instanceof Error ? cause.message : "Account deletion could not finish. Nothing was removed."); }
    finally { setRemoving(false); }
  }

  return <>
    <section className="settings-section" id="account" aria-label="Optional account">
      <div><h2>Optional account</h2><p>Guest mode is complete on its own. An account adds sync across devices.</p></div>
      <div className="settings-fields">
        {!account.ready ? <div className="skeleton" style={{ height: 72 }} role="status" aria-label="Loading account" />
          : user ? <>
            <div className="account-summary">
              <span className="avatar" aria-hidden="true">{user.avatar}</span>
              <div><strong>{user.name}</strong><small className="muted">{user.handle ? `@${user.handle}` : "No public handle yet"}</small></div>
              <SyncStatus />
            </div>
            <div className="row wrap"><Button variant="secondary" onClick={() => void account.logout()}><LogOut size={14} aria-hidden="true" />Sign out</Button></div>
          </> : <>
            <p>Right now everything is <strong>saved on this device</strong>. Sign in if you want it on your other devices too, or to join the optional leaderboard. You can keep using Iwons exactly as you are.</p>
            {account.providers.length ? <div className="provider-buttons">{account.providers.map(provider => <Button key={provider} variant="secondary"
              onClick={() => void signIn(provider, { callbackUrl: "/settings/#account" })}>
              {provider === "github" ? <Github size={15} aria-hidden="true" /> : <span className="provider-glyph" aria-hidden="true">G</span>}
              Continue with {provider === "github" ? "GitHub" : "Google"}</Button>)}</div>
              : <p className="screen-note">Sign-in isn’t set up on this site yet. Everything else works as a guest.</p>}
            <small className="muted">New here? Continuing creates your account. We never post anything or share your email.</small>
          </>}
        {account.error ? <p className="error-box" role="alert">{account.error}</p> : null}
      </div>
    </section>

    {user ? <>
      <section className="settings-section" aria-labelledby="handle-heading">
        <div><h2 id="handle-heading">Public handle</h2><p>The only name others can see, and only if you join the leaderboard.</p></div>
        <form className="settings-fields" onSubmit={event => { event.preventDefault(); if (parsedHandle.success) void patch({ handle }, setHandleState); }}>
          {!user.handle ? <p className="screen-note">Pick a handle whenever you’re ready. Practice and sync work without one{suggestion ? <>, or use <strong>{suggestion}</strong></> : null}.</p> : null}
          <label>Handle<input value={handle} maxLength={20} autoComplete="username" spellCheck={false} aria-describedby={handleHelp}
            aria-invalid={handle.length > 0 && !parsedHandle.success} onChange={event => { setHandle(event.target.value.toLowerCase()); setHandleState(""); }} /></label>
          <ul id={handleHelp} className="handle-rules">
            {rules.map(rule => <li key={rule.label} className={rule.ok ? "success" : "muted"}>
              {rule.ok ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}{rule.label}<span className="visually-hidden">{rule.ok ? ": done" : ": not yet"}</span></li>)}
            {reservedWord ? <li className="danger">That one’s reserved. Try another.</li> : null}
            <li className={availability === "available" ? "success" : availability === "taken" || availability === "invalid" ? "danger" : "muted"} role="status">
              {availability === "available" ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
              {availability === "available" ? "Available" : availability === "taken" ? "Already taken. Try another handle."
                : availability === "checking" ? "Checking availability…" : availability === "invalid" ? "Use 3–20 lowercase letters, numbers or _."
                  : availability === "reserved" ? "That handle is reserved." : "Availability will be checked when you save."}
            </li>
          </ul>
          <div className="row wrap">
            <Button type="submit" disabled={!parsedHandle.success || handle === user.handle || availability === "taken"} loading={handleState === "saving"}>Save handle</Button>
            {suggestion && handle !== suggestion ? <Button type="button" variant="ghost" onClick={() => setHandle(suggestion)}>Use {suggestion}</Button> : null}
            <SavedNote state={handleState === "saving" ? "" : handleState} />
          </div>
        </form>
      </section>

      <section className="settings-section" aria-labelledby="privacy-heading">
        <div><h2 id="privacy-heading">Privacy</h2><p>You decide what’s public.</p></div>
        <div className="settings-fields">
          <label className="check-row"><input type="checkbox" role="switch" checked={optIn} disabled={!user.handle || privacyState === "saving"}
            onChange={event => { const next = event.target.checked; setOptIn(next);
              void patch({ leaderboardOptIn: next }, setPrivacyState).then(ok => { if (!ok) setOptIn(!next); }); }} />
            <span>Join the leaderboard <small>Off by default. You can leave any time.</small></span></label>
          <SavedNote state={privacyState} />
          {!user.handle ? <p>Choose a handle above first. It’s what appears on the board.</p> : null}
          <div className="privacy-table">
            <div><strong>Public when you join</strong><p>Your handle, avatar letter, solved count and points.</p></div>
            <div><strong>Always private</strong><p>Your name, email, code, drafts and submission history.</p></div>
          </div>
          <p>Only solves checked by the server judge count. <Link className="text-link" href="/leaderboard/">See the leaderboards</Link></p>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="data-heading">
        <div><h2 id="data-heading">Your account data</h2><p>A full copy, any time.</p></div>
        <div className="settings-fields">
          <p>Download everything stored on your account as JSON: profile, synced progress, drafts and submissions.</p>
          <div><Button variant="secondary" loading={exporting} onClick={() => void exportData()}><Download size={14} aria-hidden="true" />Export account data</Button></div>
          {exportError ? <p className="error-box" role="alert">{exportError}</p> : null}
        </div>
      </section>

      <section className="settings-section danger-zone" aria-labelledby="delete-heading">
        <div><h2 id="delete-heading" className="danger">Delete account</h2><p>Permanent. Guest data on this device stays.</p></div>
        <div className="settings-fields">
          <p>Removes your account from our servers. Consider exporting a copy first.</p>
          <div><Button variant="danger" onClick={() => { setConfirmation(""); setDeleting(true); }}><Trash2 size={14} aria-hidden="true" />Delete account</Button></div>
        </div>
      </section>
      <Modal open={deleting} onClose={() => setDeleting(false)} title="Delete your account?">
        <p>This permanently removes:</p>
        <ul className="import-facts"><li>Your profile and handle</li><li>Synced progress and drafts</li><li>Server submissions and leaderboard entries</li></ul>
        <p>Your separate guest progress stays on this device. Public leaderboard pages may show you for about a minute while caches refresh.</p>
        <label>Type DELETE to confirm<input value={confirmation} autoComplete="off" onChange={event => setConfirmation(event.target.value)} /></label>
        <div className="modal-actions"><Button variant="secondary" onClick={() => setDeleting(false)}>Keep my account</Button>
          <Button variant="danger" disabled={confirmation !== "DELETE"} loading={removing} onClick={() => void removeAccount()}>Delete my account permanently</Button></div>
        {deleteError ? <p className="error-box" role="alert">{deleteError}</p> : null}
      </Modal>
    </> : null}
  </>;
}
