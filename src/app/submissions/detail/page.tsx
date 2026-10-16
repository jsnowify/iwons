import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { SubmissionDetail } from "@/components/submissions";
export const metadata: Metadata = {
  title: "Submission detail",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <SubmissionDetail problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
