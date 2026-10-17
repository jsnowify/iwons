import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { SubmissionsPage } from "@/components/submissions";
export const metadata: Metadata = {
  title: "Submissions",
  description: "View your coding submissions, runtime benchmarks, and solve history.",
  alternates: { canonical: "/submissions/" },
};
export default function Page() {
  return <SubmissionsPage problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
