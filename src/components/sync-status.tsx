"use client";
import { HardDrive, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useAccount } from "./account-provider";

/** Quiet, always-visible note about where the learner's work is kept. */
export function SyncStatus() {
  const account = useAccount();
  const [Icon, text, tone] = !account.user ? [HardDrive, "Saved on this device", "muted"] as const
    : account.syncState === "error" ? [CloudOff, "Couldn’t sync, will retry", "warning"] as const
      : account.syncState === "synced" ? [Cloud, "Synced", "muted"] as const
        : [RefreshCw, "Syncing…", "muted"] as const;
  return <span className={`sync-status ${tone}`} role="status" aria-live="polite"
    title={account.user ? "Your drafts and progress sync to your account." : "Guest work stays in this browser. Export a backup any time in Settings."}>
    <Icon size={12} aria-hidden="true" />{text}
  </span>;
}
