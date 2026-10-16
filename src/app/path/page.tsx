import type { Metadata } from "next";
import { getLevels } from "@/lib/problems";
import { PathMap } from "@/components/path-map";
export const metadata: Metadata = {
  title: "The Iwons Path",
  description:
    "A nine-chapter coding adventure from your first loop to your first graph. Explore 500 original exercises in 54 units across nine chapters.",
  alternates: { canonical: "/path/" },
};
export default function Page() {
  return (
    <div className="content">
      <PathMap levels={getLevels().map(({id,name,subtitle,tier,count,released,concepts}) => ({id,name,subtitle,tier,count,released,concepts}))} />
    </div>
  );
}
