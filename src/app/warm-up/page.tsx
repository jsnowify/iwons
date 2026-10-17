import { problems } from "@/lib/catalog";
import { WarmUp } from "@/components/warm-up";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Daily Warm-up",
  description: "Daily 3-problem spaced repetition warmup to maintain your coding streak.",
  alternates: { canonical: "/warm-up/" },
};
export default function Page(){return <WarmUp problems={problems.map(({id,slug,title,difficulty,level,topics,patterns,overview,complexity})=>({id,slug,title,difficulty,level,topics,patterns,overview,complexity}))}/>;}
