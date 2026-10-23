import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomProblemWorkspace } from "@/components/room-problem-workspace";
import { REF_KEY, ROOM_CODE } from "@/lib/rooms/contracts";
export const metadata: Metadata = { title: "Room problem", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ code: string; refKey: string }> }) {
  const { code, refKey } = await params;
  if (!ROOM_CODE.test(code) || !REF_KEY.test(refKey)) notFound();
  return <RoomProblemWorkspace code={code} refKey={refKey} />;
}
