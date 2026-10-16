import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { ContestPage } from "@/components/contest";
export const metadata: Metadata = {
  title: "Contest",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ContestPage problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
