import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings";
export const metadata: Metadata = {
  title: "Settings",
  description: "Customize your editor, theme preferences, local data backups, and keybindings.",
  alternates: { canonical: "/settings/" },
};
export default function Page() {
  return <SettingsPage />;
}
