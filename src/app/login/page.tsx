import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeReturnTo } from "@/lib/accounts/return-to";
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false }, alternates: { canonical: "/login/" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[]; password?: string | string[] }> }) {
  const { next, password } = await searchParams;
  return <AuthForm signup={false} next={safeReturnTo(next)} passwordWasReset={password === "reset"} />;
}
