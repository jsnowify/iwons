"use client";
import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { useAccount } from "./account-provider";
import { PasswordField } from "./password-field";
import { Button, Modal } from "./ui";

const failure = z.object({ error: z.string(), fieldErrors: z.object({ password: z.string().optional() }).optional() });
/** Permanent account deletion for credential accounts. Needs the password and a typed confirmation. */
export function DeleteAccountPanel() {
  const account = useAccount(), id = useId();
  const [open, setOpen] = useState(false), [confirmation, setConfirmation] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [passwordError, setPasswordError] = useState("");
  function close() { if (busy) return; setOpen(false); setConfirmation(""); setPassword(""); setError(""); setPasswordError(""); }
  async function remove(event: React.FormEvent) {
    event.preventDefault(); if (busy || !account.user || confirmation !== "DELETE") return;
    if (!password) { setPasswordError("Enter your current password."); return; }
    setBusy(true); setError(""); setPasswordError("");
    try {
      const response = await fetch("/api/me/", { method: "DELETE", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "X-Iwons-Account": account.user.id }, body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(30000) });
      const body: unknown = await response.json();
      if (!response.ok) {
        const issue = failure.safeParse(body);
        if (issue.success && issue.data.fieldErrors?.password) setPasswordError(issue.data.fieldErrors.password);
        throw new Error(issue.success ? issue.data.error : "Your account could not be deleted. Try again.");
      }
      setOpen(false); setPassword(""); setConfirmation("");
      await account.accountDeleted();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your account could not be deleted. Try again."); }
    finally { setBusy(false); }
  }
  if (!account.user) return null;
  return <section className="delete-account-panel" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="danger">Delete account</h2>
    <p>Permanently removes your account from our servers. Guest progress on this device stays. Export your data first if you want a copy.</p>
    <Button variant="danger" onClick={() => setOpen(true)}><Trash2 size={14} aria-hidden="true" />Delete account</Button>
    <Modal open={open} onClose={close} title="Delete your account?">
      <form className="auth-form" aria-label="Delete account" noValidate onSubmit={remove}>
        <p>This permanently removes:</p>
        <ul className="import-facts"><li>Your username, display name, email and photo</li><li>Synced progress, drafts and submissions</li>
          <li>Your places in rooms; rooms you host are ended</li></ul>
        <p>Your username stays reserved so nobody else can take it. This cannot be undone.</p>
        <PasswordField id={`${id}-password`} name="password" label="Current password" value={password} onChange={value => { setPassword(value); setError(""); setPasswordError(""); }}
          autoComplete="current-password" disabled={busy} error={passwordError} />
        <label>Type DELETE to confirm<input value={confirmation} autoComplete="off" disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={close}>Keep my account</Button>
          <Button type="submit" variant="danger" disabled={confirmation !== "DELETE"} loading={busy}>Delete my account permanently</Button></div>
        {error ? <p className="error-box" role="alert">{error}</p> : null}
      </form>
    </Modal>
  </section>;
}
