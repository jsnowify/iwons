import type { Metadata } from "next";
import { PlansPage } from "@/components/plans";
export const metadata: Metadata = {
  title: "Study plans",
  alternates: { canonical: "/plans/" },
};
export default function Page() {
  return <PlansPage />;
}
