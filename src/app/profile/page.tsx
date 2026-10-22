import type { Metadata } from "next";
import { AccountProfile } from "@/components/account-profile";
export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false }, alternates: { canonical: "/profile/" } };
export default function Page() { return <AccountProfile />; }
