import type { Metadata } from "next";
import { CustomWorkspace } from "@/components/author";
export const metadata: Metadata = {
  title: "Custom problem",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CustomWorkspace />;
}
