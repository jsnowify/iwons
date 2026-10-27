"use client";
import { useId, useState } from "react";
import { Download } from "lucide-react";
import { accountRequest, useAccount } from "./account-provider";
import { Button, useToast } from "./ui";

/** Downloads everything stored on the signed-in account as one JSON file. */
export function ExportDataPanel() {
  const account = useAccount(), id = useId(), toast = useToast();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (!account.user) return null;
  async function download() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await accountRequest("/api/me/export/");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "Iwons-account-backup.json"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Your account data is downloading.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Export could not finish. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="export-data-panel" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Your account data</h2>
    <p>Download a copy of your username, display name, email, synced progress, drafts and submissions as a JSON file. It never includes your password.</p>
    <Button variant="secondary" loading={busy} onClick={() => void download()}><Download size={14} aria-hidden="true" />Export my data</Button>
    {error ? <p className="error-box" role="alert">{error}</p> : null}
  </section>;
}
