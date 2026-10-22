import type { Metadata } from "next";
import { ResetPassword } from "@/components/reset-password";
export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: "/reset-password/" } };
export default function Page() { return <ResetPassword />; }
