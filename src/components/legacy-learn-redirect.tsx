"use client";
import { useEffect } from "react";
import Link from "next/link";

// Static hosts use the generated permanent redirect map. This fallback also
// works on hosts that only serve files and do not support redirect rules.
export function LegacyLearnRedirect({ href }: { href: string }) {
  useEffect(() => { window.location.replace(href); }, [href]);
  return <div className="content"><h1>This course has a new address.</h1><Link href={href}>Continue to the course</Link></div>;
}
