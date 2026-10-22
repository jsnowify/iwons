import type { Metadata } from "next";
import { FoundationOverview } from "@/components/foundation-overview";

export const metadata: Metadata = {
  title: "Optional Foundation lessons",
  description: "An optional beginner course in five modules, from variables and loops to data structures and software engineering basics. Challenges are always open.",
  alternates: { canonical: "/foundation/" },
};
export default function Page() {
  return <div className="content foundation-page"><FoundationOverview /></div>;
}
