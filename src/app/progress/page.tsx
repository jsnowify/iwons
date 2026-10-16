import type { Metadata } from "next";
import { ProgressPage } from "@/components/progress";
export const metadata: Metadata = {
  title: "Progress",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ProgressPage />;
}
