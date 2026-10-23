import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomCustomEditor } from "@/components/room-custom-editor";
import { ROOM_CODE } from "@/lib/rooms/contracts";
export const metadata: Metadata = { title: "Custom problem", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await params;
  if (!ROOM_CODE.test(code) || !/^(new|[a-z0-9-]{1,100})$/.test(id)) notFound();
  return <RoomCustomEditor code={code} id={id} />;
}
