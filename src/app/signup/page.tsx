import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeReturnTo } from "@/lib/accounts/return-to";
export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false }, alternates: { canonical: "/signup/" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AuthForm signup={true} next={safeReturnTo(next)} />;
}
