import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomJoin } from "@/components/room-join";
import { INVITE_TOKEN } from "@/lib/rooms/contracts";
export const metadata: Metadata = { title: "Join a room", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ inviteToken: string }> }) {
  const { inviteToken } = await params;
  if (!INVITE_TOKEN.test(inviteToken)) notFound();
  return <RoomJoin token={inviteToken} />;
}
