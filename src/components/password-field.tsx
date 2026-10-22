"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({ id, name, label, value, onChange, autoComplete, disabled, error, help }: {
  id: string; name: string; label: string; value: string; onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password" | "one-time-code"; disabled?: boolean; error?: string; help?: string;
}) {
  const [shown, setShown] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label>
    <span className="auth-password">
      <input id={id} name={name} maxLength={144} type={shown ? "text" : "password"} required value={value} onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete} disabled={disabled} aria-invalid={!!error}
        aria-describedby={`${help ? `${id}-help ` : ""}${error ? `${id}-error` : ""}`.trim() || undefined} />
      <button type="button" className="btn secondary" aria-label={`${shown ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={shown}
        onClick={() => setShown(current => !current)}>{shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{shown ? "Hide" : "Show"}</button>
    </span>
    {help ? <small id={`${id}-help`} className="muted">{help}</small> : null}
    {error ? <span id={`${id}-error`} className="field-error">{error}</span> : null}
  </div>;
}
