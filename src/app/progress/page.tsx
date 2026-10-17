import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { ProgressPage } from "@/components/progress";
export const metadata: Metadata = {
  title: "Progress",
  description: "Track your coding journey, completed chapters, solve rates, and study stats on Iwons.",
  alternates: { canonical: "/progress/" },
};
export default function Page() {
  return <ProgressPage problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
