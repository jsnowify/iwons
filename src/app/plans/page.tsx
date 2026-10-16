import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { PlansPage } from "@/components/plans";
export const metadata: Metadata = {
  title: "Study plans",
  alternates: { canonical: "/plans/" },
};
export default function Page() {
  return <PlansPage problems={problems.map(({id,slug,title,difficulty,level,topics,patterns})=>({id,slug,title,difficulty,level,topics,patterns}))} />;
}
