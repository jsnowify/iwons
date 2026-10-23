"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DoorOpen } from "lucide-react";
import { Button } from "./ui";
import { AuthLink } from "./auth-link";
import { useAccount } from "./account-provider";
import { ErrorRetry, ListSkeleton, MemberCount, RoomNote } from "./rooms-ui";
import { api, messageOf, roomPath, useResource, type InvitePreview } from "@/lib/rooms/client";

const unavailable = { expired: "This invite link has expired. Ask the host for a new one.", ended: "This room has ended and is no longer accepting members.", full: "This room is full right now." } as const;

export function RoomJoin({ token }: { token: string }) {
  const router = useRouter(), account = useAccount();
  const preview = useResource(() => api<InvitePreview>(`/api/rooms/join/${token}/`), [token]);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function join() {
    setBusy(true); setError("");
    try { const result = await api<{ code: string }>(`/api/rooms/join/${token}/`, "POST"); router.replace(roomPath(result.code)); }
    catch (cause) { setError(messageOf(cause)); setBusy(false); }
  }
  const data = preview.data;
  return <div className="content auth-content">
    <article className="card auth-card room-join" aria-busy={preview.loading || busy}>
      {preview.loading && !data ? <ListSkeleton label="Loading the invitation" rows={1} />
        : !data ? <>
          <header><h1>This invite doesn’t work<span className="accent">.</span></h1></header>
          {preview.error ? <ErrorRetry message={preview.error} onRetry={preview.reload} /> : null}
          <Link className="text-link" href="/rooms/">Go to your rooms</Link></>
          : <>
            <header>
              <div className="eyebrow"><DoorOpen size={14} aria-hidden="true" /> YOU’RE INVITED</div>
              <h1>{data.name}<span className="accent">.</span></h1>
              <p className="row wrap muted">Hosted by {data.hostName}<MemberCount count={data.memberCount} max={data.maxMembers} /></p>
            </header>
            <p>Join this private room to practise the host’s problems together and see the room’s own leaderboard. Problems stay hidden until you join.</p>
            <RoomNote />
            <p role="status" aria-live="polite" className={data.state === "ok" ? "visually-hidden" : "error-box"}>{data.state === "ok" ? "This invitation is ready." : unavailable[data.state]}</p>
            {error ? <p className="error-box" role="alert" aria-live="assertive">{error}</p> : null}
            {!account.ready ? <ListSkeleton label="Checking your account" rows={1} />
              : !account.user ? <div className="stack">
                <p className="muted">You need an account to join a room. Everything else on Iwons stays open to guests.</p>
                <div className="row wrap"><AuthLink className="btn" /><AuthLink signup className="btn secondary">Create an account</AuthLink></div></div>
                : data.state === "ok" ? <Button loading={busy} onClick={() => void join()}>{busy ? "Joining…" : "Join room"}</Button>
                  : <Link className="btn secondary" href="/rooms/">Go to your rooms</Link>}
          </>}
    </article>
  </div>;
}
