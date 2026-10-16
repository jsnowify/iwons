import type { Metadata } from "next";
import { ContestPage } from "@/components/contest";
export const metadata: Metadata = {
  title: "Contest",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ContestPage />;
}
