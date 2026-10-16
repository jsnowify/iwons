import type { Metadata } from "next";
import { ProblemList } from "@/components/problem-list";
export const metadata: Metadata = {
  title: "Coding problems",
  description:
    "Explore 500 original JavaScript, TypeScript, Python, and Java coding challenges. Practice foundations, arrays, strings, trees, graphs and dynamic programming on the Iwons Path.",
  alternates: { canonical: "/problems/" },
};
export default function Problems() {
  return <ProblemList />;
}
