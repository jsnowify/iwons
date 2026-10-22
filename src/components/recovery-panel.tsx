"use client";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { useAccount } from "./account-provider";
import { PasswordField } from "./password-field";
import { Button } from "./ui";

const recoveryStatus = z.object({ configured: z.boolean(), expiresAt: z.string().nullable() }).strict();
const recoveryResult = z.object({ code: z.string(), expiresAt: z.string() }).strict();
export function RecoveryPanel() {
  const account = useAccount(), id = useId();
  const [status, setStatus] = useState<z.infer<typeof recoveryStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const controller = useRef<AbortController | null>(null), passwordInput = useRef<HTMLFormElement>(null);
  const username = account.user?.handle;
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/auth/recovery-code/", { credentials: "same-origin", cache: "no-store", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]) });
        if (!response.ok) throw new Error(); const data = recoveryStatus.parse(await response.json());
        if (!abort.signal.aborted) setStatus(data);
      } catch { if (!abort.signal.aborted) setError("Recovery status could not be loaded. You can still generate a new code."); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }
    if (username) void load();
    return () => { abort.abort(); controller.current?.abort(); };
  }, [username]);
  async function generate(event: React.FormEvent) {
    event.preventDefault(); if (busy || !account.user) return;
    if (!password) { setError("Enter your current password."); setPasswordError("Enter your current password."); passwordInput.current?.querySelector("input")?.focus(); return; }
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError(""); setPasswordError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/recovery-code/", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Iwons-Account": account.user.id }, body: JSON.stringify({ password }),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const issue = z.object({ error: z.string(), fieldErrors: z.object({ password: z.string().optional() }).optional() }).safeParse(body);
        if (issue.success && issue.data.fieldErrors?.password) setPasswordError(issue.data.fieldErrors.password);
        throw new Error(issue.success ? issue.data.error : "Your recovery code could not be created. Try again.");
      }
      const result = recoveryResult.parse(body); setCode(result.code); setPassword("");
      setStatus({ configured: true, expiresAt: result.expiresAt }); setMessage("Recovery code created. Save it somewhere private now.");
    } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Your recovery code could not be created. Try again."); }
    finally { if (!abort.signal.aborted) setBusy(false); controller.current = null; }
  }
  function download() {
    setError("");
    const text = `Iwons password recovery\nUsername: ${username}\nRecovery code: ${code}\nExpires: ${status?.expiresAt?.slice(0, 10)} (UTC)\n\nKeep this file private. This code resets your password once at /reset-password/. Generating another code replaces this one.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "iwons-recovery-code.txt"; anchor.click(); URL.revokeObjectURL(url);
    setMessage("Recovery code downloaded. Keep the file private.");
  }
  return <section className="recovery-panel" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Password recovery</h2>
    <p>Generate and save a private recovery code while you know your password. You’ll need it to reset a forgotten password.</p>
    {loading ? <p className="muted" role="status">Checking recovery setup…</p> : <p className="muted">{status ? status.configured ? `A recovery code is set up. It expires ${status.expiresAt!.slice(0, 10)} (UTC).` : "No active recovery code yet." : "Recovery setup could not be checked."}</p>}
    <form className="auth-form" ref={passwordInput} aria-label="Generate recovery code" noValidate onSubmit={generate}>
      <PasswordField id={`${id}-password`} name="password" label="Current password" value={password} onChange={value => { setPassword(value); setError(""); setPasswordError(""); }} autoComplete="current-password" disabled={busy} error={passwordError} />
      <Button type="submit" loading={busy}>{busy ? "Creating code…" : status?.configured ? "Generate new code" : "Generate recovery code"}</Button>
      <small className="muted">One use. Valid for a year. A new code replaces your previous one. Your guest work stays separate.</small>
    </form>
    {code ? <div className="recovery-secret">
      <label htmlFor={`${id}-code`}>Your private recovery code</label>
      <textarea id={`${id}-code`} readOnly value={code} rows={4} spellCheck={false} autoComplete="off" aria-describedby={`${id}-once`} />
      <p id={`${id}-once`}>Save this now. It is shown only once. Anyone with this code can reset your password.</p>
      <div className="avatar-actions">
        <Button type="button" variant="secondary" onClick={async () => {
          setError("");
          try { await navigator.clipboard.writeText(code); setMessage("Recovery code copied. Store it somewhere private."); }
          catch { setError("Copying was blocked. Select and copy the code above."); }
        }}>Copy code</Button>
        <Button type="button" variant="secondary" onClick={download}>Download code</Button>
        <Button type="button" variant="ghost" onClick={() => { setCode(""); setError(""); setMessage("Code hidden. Keep your saved copy safe."); }}>Hide code</Button>
      </div>
    </div> : null}
    {error ? <p className="error-box" role="alert">{error}</p> : null}
    {message ? <p className="success" role="status">{message}</p> : null}
  </section>;
}
