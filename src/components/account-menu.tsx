"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, UserRound, LogOut } from "lucide-react";
import { useAccount } from "./account-provider";
import { AuthLink } from "./auth-link";
import { AccountAvatar } from "./account-avatar";

/** Clear but optional "Sign in" button for guests; avatar, handle and a small menu for account holders. */
export function AccountMenu() {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false), [error, setError] = useState("");
  const menu = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!account.ready) return null;
  if (!account.user) return <AuthLink className="account-sign-in btn secondary small"><UserRound size={14} aria-hidden="true" />Sign in</AuthLink>;
  const label = account.user.handle ? `@${account.user.handle}` : account.user.name;
  return <div className="account-menu" ref={root}>
    <button ref={trigger} type="button" className="account-trigger" aria-expanded={open} aria-controls={menu}
      aria-label={`Account menu for ${label}`} onClick={() => setOpen(!open)}>
      <AccountAvatar initial={account.user.avatar} url={account.user.avatarUrl} />
      <span className="account-trigger-name">{label}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    <div id={menu} className="account-dropdown" hidden={!open}>
      <Link href="/profile/" onClick={() => setOpen(false)}><UserRound size={15} aria-hidden="true" />Profile</Link>
      <button type="button" disabled={signingOut} aria-busy={signingOut} onClick={async () => {
        setSigningOut(true); setError("");
        try { await account.logout(); setOpen(false); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Sign out could not finish. Please try again."); }
        finally { setSigningOut(false); }
      }}><LogOut size={15} aria-hidden="true" />{signingOut ? "Signing out…" : "Sign out"}</button>
      {error ? <p className="error-box" role="alert">{error}</p> : null}
    </div>
  </div>;
}
