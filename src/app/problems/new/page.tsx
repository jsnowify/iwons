import type { Metadata } from "next";
import { AuthorPage } from "@/components/author";
export const metadata: Metadata = {
  title: "Create a problem",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AuthorPage />;
}
