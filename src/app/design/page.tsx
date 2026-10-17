import type { Metadata } from "next";
import { DesignPage } from "@/components/design";
export const metadata: Metadata = {
  title: "Design system",
  description: "Color tokens, typography, surfaces, and retro mechanical design guidelines for Iwons.",
  alternates: { canonical: "/design/" },
};
export default function Page() {
  return <DesignPage />;
}
