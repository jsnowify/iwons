import { problems } from "@/lib/catalog";
import type { Metadata } from "next";
import { ListsPage } from "@/components/lists";
export const metadata: Metadata = {
  title: "My lists",
  description: "Organize and curate custom problem lists for your coding practice sessions.",
  alternates: { canonical: "/lists/" },
};
export default function Page() {
  return <ListsPage problems={problems.map(({id,slug,title,difficulty,level,topics})=>({id,slug,title,difficulty,level,topics}))} />;
}
