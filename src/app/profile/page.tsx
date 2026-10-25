import type { Metadata } from "next";
import { AccountProfile } from "@/components/account-profile";
import { problems } from "@/lib/catalog";
export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false }, alternates: { canonical: "/profile/" } };
export default function Page() { return <AccountProfile catalog={problems.map(({ id, difficulty }) => ({ id, difficulty }))} />; }
