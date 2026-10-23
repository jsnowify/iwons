import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomView } from "@/components/room-view";
import { ROOM_CODE } from "@/lib/rooms/contracts";
export const metadata: Metadata = { title: "Private room", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!ROOM_CODE.test(code)) notFound();
  return <RoomView code={code} />;
}
