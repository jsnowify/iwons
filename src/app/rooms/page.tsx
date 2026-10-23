import type { Metadata } from "next";
import { RoomsHome } from "@/components/rooms-home";
export const metadata: Metadata = { title: "Private rooms", description: "Practise with friends in a private room with its own leaderboard.", robots: { index: false, follow: false } };
export default function Page() { return <RoomsHome />; }
