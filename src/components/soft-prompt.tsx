"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cloud, X } from "lucide-react";
import { storage } from "@/lib/storage";
import { useAccount } from "./account-provider";

/**
 * A small, dismissible invitation to create an account. Renders nothing for
 * signed-in learners, when sign-in isn't configured, or once dismissed anywhere.
 */
export function SoftPrompt({ message = "Want to keep your progress on your other devices?", className = "" }: { message?: string; className?: string }) {
  const account = useAccount();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => setDismissed(storage.invitationDismissed()), []);
  if (!account.ready || account.user || !account.providers.length || dismissed) return null;
  return <aside className={`soft-prompt fade-in ${className}`} aria-label="Account suggestion">
    <Cloud size={16} aria-hidden="true" />
    <p>{message} <Link className="text-link soft-prompt-link" href="/settings/#account">Create a free account</Link>. Totally optional.</p>
    <button type="button" className="icon-button" aria-label="Dismiss account suggestion"
      onClick={() => { storage.invitationDismissed(true); setDismissed(true); }}><X size={14} aria-hidden="true" /></button>
  </aside>;
}
