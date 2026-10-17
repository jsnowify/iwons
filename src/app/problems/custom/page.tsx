import type { Metadata } from "next";
import { CustomWorkspace } from "@/components/author";
export const metadata: Metadata = {
  title: "Custom problem workspace",
  description: "Interactive coding workspace for your authored and saved custom problems.",
  alternates: { canonical: "/problems/custom/" },
};
export default function Page() {
  return <CustomWorkspace />;
}
