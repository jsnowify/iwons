"use client";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { Button } from "./ui";

/**
 * A one-time notice about what Iwons keeps in your browser. It sets no tracking
 * or advertising cookies, so there is nothing to opt out of; it only informs.
 */
export function CookieNotice() {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => setDismissed(storage.cookieNoticeDismissed()), []);
  if (dismissed) return null;
  return <aside className="cookie-notice fade-in" aria-label="Cookies and storage">
    <span className="cookie-stamp" aria-hidden="true">Cookies</span>
    <div className="cookie-copy">
      <strong>One cookie. No tracking.</strong>
      <dl className="cookie-list">
        <div><dt>iwons-session</dt><dd>Essential. Keeps you signed in for 30 days. Only set if you sign in.</dd></div>
        <div><dt>Local storage</dt><dd>Your progress, drafts and settings. Stays on this device.</dd></div>
        <div><dt>Ads and tracking</dt><dd>None.</dd></div>
      </dl>
    </div>
    <Button onClick={() => { storage.cookieNoticeDismissed(true); setDismissed(true); }}>Got it</Button>
  </aside>;
}
