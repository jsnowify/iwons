import type { Metadata } from "next";
import { DesignPage } from "@/components/design";
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <DesignPage />;
}
