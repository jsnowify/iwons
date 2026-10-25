"use client";
import { useId, useState } from "react";
import { z } from "zod";
import { credentialProfileSchema } from "@/lib/accounts/credentials";
import { useUsernameAvailability } from "@/lib/accounts/use-username-availability";
import { useAccount } from "./account-provider";
import { Button } from "./ui";

const failure = z.object({ error: z.string(), fieldErrors: z.object({ username: z.string().optional(), displayName: z.string().optional() }).optional() });
/** Lets a signed-in credential account change its username and display name. */
export function ProfileEditor() {
  const account = useAccount(), id = useId();
  const user = account.user;
  const [username, setUsername] = useState(user?.handle ?? ""), [displayName, setDisplayName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [fields, setFields] = useState<{ username?: string; displayName?: string }>({});
  const changedUsername = !!user && username !== user.handle;
  const availability = useUsernameAvailability(changedUsername ? username : "");
  if (!user) return null;
  const changedName = displayName.trim() !== user.name;
  const parsed = credentialProfileSchema.safeParse({ ...(changedUsername ? { username } : {}), ...(changedName ? { displayName } : {}) });
  const blocked = changedUsername && (availability.state === "taken" || availability.state === "invalid");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !user || !parsed.success || blocked) return;
    setBusy(true); setError(""); setMessage(""); setFields({});
    try {
      const response = await fetch("/api/me/profile/", { method: "PATCH", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "X-Iwons-Account": user.id },
        body: JSON.stringify({ ...(changedUsername ? { username } : {}), ...(changedName ? { displayName: displayName.trim() } : {}) }),
        signal: AbortSignal.timeout(15000) });
      const data: unknown = await response.json();
      if (!response.ok) {
        const issue = failure.safeParse(data);
        if (issue.success) setFields(issue.data.fieldErrors ?? {});
        throw new Error(issue.success ? issue.data.error : "Your profile could not be saved. Try again.");
      }
      await account.refreshIdentity();
      setMessage(changedUsername ? "Saved. Other devices will need to sign in again with your new username." : "Saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your profile could not be saved. Try again."); }
    finally { setBusy(false); }
  }
  return <form className="profile-editor" onSubmit={event => void save(event)} noValidate>
    <h2>Names</h2>
    <div className="auth-field">
      <label htmlFor={`${id}-name`}>Display name</label>
      <input id={`${id}-name`} value={displayName} maxLength={30} autoComplete="nickname" aria-invalid={!!fields.displayName}
        aria-describedby={`${id}-name-help`} onChange={event => { setDisplayName(event.target.value); setMessage(""); setFields({}); }} />
      <small id={`${id}-name-help`} className={fields.displayName ? "error" : "muted"}>{fields.displayName ?? "Shown in your menu and in rooms. Up to 30 characters."}</small>
    </div>
    <div className="auth-field">
      <label htmlFor={`${id}-user`}>Username</label>
      <input id={`${id}-user`} value={username} maxLength={20} autoComplete="username" spellCheck={false} aria-invalid={blocked || !!fields.username}
        aria-describedby={`${id}-user-help`} onChange={event => { setUsername(event.target.value.toLowerCase()); setMessage(""); setFields({}); }} />
      <small id={`${id}-user-help`} className={fields.username || blocked ? "error" : "muted"} aria-live="polite">
        {fields.username ?? (changedUsername ? availability.message : "3–20 letters, numbers, or underscores. Your old username stays reserved so nobody else can take it.")}
      </small>
    </div>
    <div className="avatar-actions">
      <Button type="submit" disabled={!parsed.success || blocked} loading={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      {changedUsername || changedName ? <Button type="button" variant="secondary" disabled={busy}
        onClick={() => { setUsername(user.handle ?? ""); setDisplayName(user.name); setFields({}); setError(""); }}>Reset</Button> : null}
    </div>
    <p role="status" className="muted">{message}</p>
    {error ? <p role="alert" className="error">{error}</p> : null}
  </form>;
}
