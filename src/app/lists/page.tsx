import type { Metadata } from "next";
import { ListsPage } from "@/components/lists";
export const metadata: Metadata = {
  title: "My lists",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ListsPage />;
}
