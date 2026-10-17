import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { SubmissionDetail } from "@/components/submissions";
export const metadata: Metadata = {
  title: "Submission detail",
  description: "Detailed view of your code submission, verification checks, and performance benchmarks.",
  alternates: { canonical: "/submissions/detail/" },
};
export default function Page() {
  return <SubmissionDetail problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
