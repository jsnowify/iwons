import type { Metadata } from "next";
import { SubmissionDetail } from "@/components/submissions";
export const metadata: Metadata = {
  title: "Submission detail",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <SubmissionDetail />;
}
