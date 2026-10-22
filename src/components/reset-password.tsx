"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/accounts/recovery-policy";
import { PasswordField } from "./password-field";
import { Button } from "./ui";

export function ResetPassword() {
  const id = useId(), form = useRef<HTMLFormElement>(null), controller = useRef<AbortController | null>(null);
  const [fields, setFields] = useState({ username: "", code: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => () => controller.current?.abort(), []);
  function change(name: keyof typeof fields, value: string) { setFields(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: "" })); setMessage(""); }
  function showErrors(next: Record<string, string>) {
    setErrors(next); const first = Object.keys(next).find(name => ["username", "code", "password", "confirmPassword"].includes(name));
    if (first) form.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setMessage(""); setErrors({});
    const parsed = resetPasswordSchema.safeParse(fields);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const name = String(issue.path[0]); if (!next[name]) next[name] = issue.message; }
      showErrors(next); setMessage("Please check the highlighted fields."); return;
    }
    const abort = new AbortController(); controller.current = abort; setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password/", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data), signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const failure = z.object({ error: z.string(), fieldErrors: z.record(z.string(), z.string()).optional() }).safeParse(body);
        setMessage(failure.success ? failure.data.error : "Your password could not be reset. Try again.");
        if (failure.success && failure.data.fieldErrors) showErrors(failure.data.fieldErrors); return;
      }
      z.object({ reset: z.literal(true) }).strict().parse(body);
      setFields({ username: "", code: "", password: "", confirmPassword: "" });
      setSuccess("Password reset. Taking you to sign in…"); window.location.assign("/login/?password=reset");
    } catch { if (!abort.signal.aborted) setMessage("We couldn’t confirm the reset. Try signing in with your new password, or try again."); }
    finally { if (!abort.signal.aborted) setBusy(false); controller.current = null; }
  }
  return <div className="content auth-content"><article className="card auth-card">
    <header><h1>Reset your password<span className="accent">.</span></h1><p>Use the private recovery code you saved from Profile. This code works once and signs out your other sessions.</p></header>
    <form className="auth-form" ref={form} noValidate aria-label="Reset password" onSubmit={submit}>
      <div className="auth-field"><label htmlFor={`${id}-username`}>Username</label>
        <input id={`${id}-username`} name="username" required maxLength={20} autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={busy} value={fields.username} onChange={event => change("username", event.target.value)}
          aria-invalid={!!errors.username} aria-describedby={errors.username ? `${id}-username-error` : undefined} />
        {errors.username ? <span id={`${id}-username-error`} className="field-error">{errors.username}</span> : null}
      </div>
      <PasswordField id={`${id}-code`} name="code" label="Recovery code" autoComplete="one-time-code" value={fields.code} onChange={value => change("code", value)} disabled={busy} error={errors.code} help="Paste your saved IWONS recovery code." />
      <PasswordField id={`${id}-password`} name="password" label="New password" autoComplete="new-password" value={fields.password} onChange={value => change("password", value)} disabled={busy} error={errors.password} help="8–72 characters. Spaces and passphrases are welcome." />
      <PasswordField id={`${id}-confirm`} name="confirmPassword" label="Confirm new password" autoComplete="new-password" value={fields.confirmPassword} onChange={value => change("confirmPassword", value)} disabled={busy} error={errors.confirmPassword} />
      {message ? <p className="error-box" role="alert">{message}</p> : null}
      {success ? <p className="success" role="status">{success}</p> : null}
      <Button type="submit" loading={busy}>{busy ? "Resetting password…" : "Reset password"}</Button>
    </form>
    <p className="muted">A saved recovery code is required. If you can still sign in, generate one in <Link className="text-link" href="/profile/">Profile</Link>.</p>
    <Link className="text-link" href="/login/">Back to sign in</Link><Link className="text-link muted" href="/">Continue as a guest</Link>
  </article></div>;
}
