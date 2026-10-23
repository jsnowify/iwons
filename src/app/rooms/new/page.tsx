import type { Metadata } from "next";
import { RoomForm } from "@/components/room-form";
export const metadata: Metadata = { title: "Create a room", robots: { index: false, follow: false } };
export default function Page() { return <RoomForm />; }
