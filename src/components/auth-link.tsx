"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { safeReturnTo } from "@/lib/accounts/return-to";

export function AuthLink({ children = "Sign in", signup = false, className = "text-link" }: { children?: ReactNode; signup?: boolean; className?: string }) {
  const router = useRouter();
  const destination = signup ? "/signup/" : "/login/";
  return <Link href={destination} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const next = safeReturnTo(location.pathname + location.search + location.hash);
    router.push(`${destination}?next=${encodeURIComponent(next)}`);
  }}>{children}</Link>;
}
