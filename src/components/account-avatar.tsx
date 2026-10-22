"use client";
import Image from "next/image";
import { useState } from "react";

export function AccountAvatar({ initial, url, className = "" }: { initial: string; url?: string; className?: string }) {
  const [failed, setFailed] = useState<string | undefined>();
  // Only ever load the signed-in account's own photo endpoint.
  const photo = url && url.startsWith("/api/me/avatar/") && failed !== url ? url : undefined;
  return <span className={`avatar ${photo ? "avatar-photo" : ""} ${className}`} aria-hidden="true">
    {photo ? <Image src={photo} width={256} height={256} alt="" unoptimized onError={() => setFailed(photo)} /> : initial}
  </span>;
}
