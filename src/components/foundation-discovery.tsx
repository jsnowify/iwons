"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { Button } from "./ui";

export function FoundationDiscovery() {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { setDismissed(storage.foundationDiscoveryDismissed()); }, []);
  if (dismissed) return null;
  return <div className="foundation-discovery">
    <p>New to coding? The optional <Link className="text-link" href="/foundation/">Foundation lessons</Link> can help.</p>
    <Button variant="ghost" aria-label="Dismiss Foundation suggestion" onClick={() => { storage.foundationDiscoveryDismissed(true); setDismissed(true); }}>Dismiss</Button>
  </div>;
}
