"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { credentialLoginSchema, credentialSignupSchema } from "@/lib/accounts/credentials";
import { safeReturnTo } from "@/lib/accounts/return-to";
import { useUsernameAvailability } from "@/lib/accounts/use-username-availability";
import { Button } from "./ui";

const resultSchema = z.object({ user: z.object({ username: z.string(), displayName: z.string() }).strict() }).strict();
const errorSchema = z.object({ error: z.string(), fieldErrors: z.record(z.string(), z.string()).optional() });
type Fields = { username: string; email: string; displayName: string; password: string };
export function AuthForm({ signup, next, passwordWasReset = false }: { signup: boolean; next: string; passwordWasReset?: boolean }) {
  const id = useId();
  const [fields, setFields] = useState<Fields>({ username: "", email: "", displayName: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(""), [success, setSuccess] = useState(passwordWasReset ? "Your password was reset. Sign in with your new password." : "");
  const [showPassword, setShowPassword] = useState(false), [busy, setBusy] = useState(false);
  const availability = useUsernameAvailability(signup ? fields.username : "");
  const controller = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  function change(name: keyof Fields, value: string) {
    setFields(current => ({ ...current, [name]: name === "username" ? value.toLowerCase() : value }));
    setErrors(current => ({ ...current, [name]: "" })); setMessage(""); setSuccess("");
  }
  function fieldError(name: keyof Fields) { return errors[name] ? <span id={`${id}-${name}-error`} className="field-error">{errors[name]}</span> : null; }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setErrors({}); setMessage(""); setSuccess("");
    const parsed = signup ? credentialSignupSchema.safeParse(fields) : credentialLoginSchema.safeParse({ username: fields.username, password: fields.password });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const name = String(issue.path[0]); if (!nextErrors[name]) nextErrors[name] = issue.message;
      }
      setErrors(nextErrors); setMessage("Please check the highlighted fields.");
      form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    const abort = new AbortController(); controller.current = abort; setBusy(true);
    try {
      const response = await fetch(`/api/auth/${signup ? "signup" : "login"}/`, { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
      });
      const data: unknown = await response.json();
      if (!mounted.current) return;
      if (!response.ok) {
        const failure = errorSchema.safeParse(data);
        setMessage(failure.success ? failure.data.error : "This could not finish. Please try again.");
        if (failure.success && failure.data.fieldErrors) {
          setErrors(failure.data.fieldErrors);
          const first = Object.keys(failure.data.fieldErrors).find(name => ["username", "email", "displayName", "password"].includes(name));
          if (first) form.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
        }
        return;
      }
      resultSchema.parse(data);
      setSuccess(signup ? "Account created. Taking you back…" : "Signed in. Taking you back…");
      window.location.assign(safeReturnTo(next));
    } catch {
      if (mounted.current && !abort.signal.aborted) setMessage("We could not reach the account service. Your guest work is safe. Please try again.");
    } finally { if (mounted.current) setBusy(false); controller.current = null; }
  }
  const HintIcon = availability.state === "available" ? CheckCircle2 : availability.state === "checking" ? Loader2
    : ["taken", "invalid", "error"].includes(availability.state) ? AlertCircle : Circle;
  return <div className="content auth-content">
    <article className="card auth-card">
      <header><h1>{signup ? "Create an account" : "Sign in"}<span className="accent">.</span></h1>
        <p>{signup ? "Create a free account to keep your progress on other devices. Totally optional." : "Welcome back. Enter your username and password."}</p>
      </header>
      <form ref={form} className="auth-form" aria-label={signup ? "Create account" : "Sign in"} noValidate onSubmit={submit}>
        <div className="auth-field"><label htmlFor={`${id}-username`}>Username</label>
          <input id={`${id}-username`} name="username" required value={fields.username} onChange={event => change("username", event.target.value)}
            autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} disabled={busy}
            aria-invalid={!!errors.username || signup && ["taken", "invalid"].includes(availability.state)}
            aria-describedby={`${signup ? `${id}-availability ` : ""}${errors.username ? `${id}-username-error` : ""}`.trim() || undefined} />
          {fieldError("username")}
        </div>
        {signup ? <>
          <p id={`${id}-availability`} className="auth-availability" role="status" aria-live="polite">
            <HintIcon size={16} className={availability.state === "checking" ? "animate-spin" : ""} aria-hidden="true" />{availability.message}
          </p>
          <div className="auth-field"><label htmlFor={`${id}-email`}>Email</label>
            <input id={`${id}-email`} name="email" type="email" required maxLength={254} value={fields.email} onChange={event => change("email", event.target.value)}
              autoComplete="email" disabled={busy} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-error` : `${id}-email-help`} />
            <small id={`${id}-email-help`} className="muted">Your email is not shown publicly.</small>{fieldError("email")}
          </div>
          <div className="auth-field"><label htmlFor={`${id}-displayName`}>Display name <span className="muted">(optional)</span></label>
            <input id={`${id}-displayName`} name="displayName" maxLength={60} autoComplete="nickname" value={fields.displayName} onChange={event => change("displayName", event.target.value)}
              disabled={busy} aria-invalid={!!errors.displayName} aria-describedby={`${id}-display-help${errors.displayName ? ` ${id}-displayName-error` : ""}`} />
            <small id={`${id}-display-help`} className="muted">Shown on leaderboards. Defaults to your username.</small>{fieldError("displayName")}
          </div>
        </> : null}
        <div className="auth-field">
          <div className="auth-label-row"><label htmlFor={`${id}-password`}>Password</label>
            {!signup ? <Link className="text-link" href="/reset-password/">Forgot your password?</Link> : null}</div>
          <span className="auth-password">
            <input id={`${id}-password`} name="password" maxLength={144} type={showPassword ? "text" : "password"} value={fields.password} onChange={event => change("password", event.target.value)} required
              autoComplete={signup ? "new-password" : "current-password"} disabled={busy} aria-invalid={!!errors.password}
              aria-describedby={`${signup ? `${id}-password-help ` : ""}${errors.password ? `${id}-password-error` : ""}`.trim() || undefined} />
            <button type="button" className="btn secondary" aria-controls={`${id}-password`} aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{showPassword ? "Hide" : "Show"}</button>
          </span>
          {signup ? <small id={`${id}-password-help`} className="muted">8–72 characters. Spaces and passphrases are welcome.</small> : null}{fieldError("password")}
        </div>
        {message ? <p className="error-box" role="alert" aria-live="assertive"><AlertCircle size={16} aria-hidden="true" />{message}</p> : null}
        {success ? <p className="success" role="status">{success}</p> : null}
        <Button type="submit" loading={busy}>{busy ? signup ? "Creating account…" : "Signing in…" : signup ? "Create account" : "Sign in"}</Button>
      </form>
      <footer className="auth-alternatives">
        <p>{signup ? "Already have an account?" : "New here?"}</p>
        <Link className="btn secondary" href={`${signup ? "/login/" : "/signup/"}?next=${encodeURIComponent(safeReturnTo(next))}`}>{signup ? "Sign in" : "Create an account"}</Link>
        <p className="auth-guest">Accounts are optional. <Link className="text-link" href={safeReturnTo(next)}>Continue as a guest</Link></p>
      </footer>
    </article>
  </div>;
}
