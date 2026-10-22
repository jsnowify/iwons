import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { ContestPage } from "@/components/contest";
export const metadata: Metadata = {
  title: "Contest mode",
  description: "Practice competitive coding sprints with focused timers and original algorithmic problems.",
  alternates: { canonical: "/contest/" },
};
export default function Page() {
  return <ContestPage problems={problems.map(({id,slug,title,difficulty,level,topics,unit})=>({id,slug,title,difficulty,level,topics,unit}))} />;
}
