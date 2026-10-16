import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { ReviewPage } from "@/components/review";
export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ReviewPage problems={problems.map(({id,slug,title,difficulty,level,topics,patterns,overview,complexity})=>({id,slug,title,difficulty,level,topics,patterns,overview,complexity}))} />;
}
