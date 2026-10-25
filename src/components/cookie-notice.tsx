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
      <p>Your practice progress stays in this browser&rsquo;s local storage. If you sign in, a single essential cookie keeps you signed in. We use no advertising or tracking cookies.</p>
    </div>
    <Button onClick={() => { storage.cookieNoticeDismissed(true); setDismissed(true); }}>Got it</Button>
  </aside>;
}
