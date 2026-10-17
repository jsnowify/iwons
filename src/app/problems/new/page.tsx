import type { Metadata } from "next";
import { AuthorPage } from "@/components/author";
export const metadata: Metadata = {
  title: "Create a problem",
  description: "Author custom coding challenges with test cases in JavaScript, TypeScript, Python, and Java.",
  alternates: { canonical: "/problems/new/" },
};
export default function Page() {
  return <AuthorPage />;
}
