"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Clock, LogOut } from "lucide-react";
import { Badge, Button } from "./ui";
import { ConfirmModal, ErrorRetry, ListSkeleton, MemberCount, RoomNote, RoomsGate, StatusBadge } from "./rooms-ui";
import { ProblemsTab } from "./room-problems-tab";
import { InviteTab, LeaderboardTab, MembersTab, SettingsTab } from "./room-tabs";
import { api, formatWhen, messageOf, useResource, type RoomDetail } from "@/lib/rooms/client";

type TabKey = "problems" | "leaderboard" | "members" | "settings" | "invite";
const labels: Record<TabKey, string> = { problems: "Problems", leaderboard: "Leaderboard", members: "Members", settings: "Settings", invite: "Invite" };

function Room({ code }: { code: string }) {
  const router = useRouter();
  const room = useResource(() => api<RoomDetail>(`/api/rooms/${code}/`), [code]);
  const [tab, setTab] = useState<TabKey>("problems");
  const [leaving, setLeaving] = useState(false), [busy, setBusy] = useState(false), [leaveError, setLeaveError] = useState("");
  const data = room.data;
  if (room.loading && !data) return <div className="content"><ListSkeleton label="Loading the room" rows={2} /></div>;
  if (!data) return <div className="content stack">
    <Link href="/rooms/" className="text-link"><ArrowLeft size={13} aria-hidden="true" /> All rooms</Link>
    <ErrorRetry message={room.error ?? "This room could not be loaded."} onRetry={room.reload} /></div>;
  const isHost = data.role === "host";
  const keys: TabKey[] = isHost ? ["problems", "leaderboard", "members", "settings", "invite"] : ["problems", "leaderboard", "members"];
  async function leave() {
    setBusy(true); setLeaveError("");
    try { await api(`/api/rooms/${code}/leave/`, "POST"); router.push("/rooms/"); }
    catch (cause) { setLeaveError(messageOf(cause)); setBusy(false); }
  }
  return <div className="content">
    <Link href="/rooms/" className="text-link"><ArrowLeft size={13} aria-hidden="true" /> All rooms</Link>
    <div className="page-heading room-heading">
      <div>
        <div className="eyebrow">PRIVATE ROOM</div>
        <h1>{data.name}<span className="accent">.</span></h1>
        <p className="row wrap muted"><StatusBadge status={data.status} upcoming={!data.started} />{isHost ? <Badge>You host this room</Badge> : <span>Hosted by {data.hostName}</span>}
          <MemberCount count={data.memberCount} max={data.maxMembers} />
          {data.startsAt && !data.started ? <span className="row"><Clock size={13} aria-hidden="true" />Starts {formatWhen(data.startsAt)}</span> : null}
          {data.endsAt ? <span className="row"><Clock size={13} aria-hidden="true" />{data.status === "ended" ? "Ended" : "Ends"} {formatWhen(data.endsAt)}</span> : null}</p>
        {data.description ? <p className="room-description">{data.description}</p> : null}
      </div>
      {!isHost ? <Button variant="ghost" className="small" onClick={() => { setLeaveError(""); setLeaving(true); }}><LogOut size={14} aria-hidden="true" />Leave room</Button> : null}
    </div>
    {data.status === "ended" ? <p className="room-note" role="status">This room has ended. You can still look around, but submissions are closed.</p> : null}
    <RoomNote />
    <div className="tabs" role="tablist" aria-label="Room sections">{keys.map((key, index) => <button key={key} id={`room-tab-${key}`} role="tab" className={`tab ${tab === key ? "active" : ""}`}
      aria-selected={tab === key} aria-controls="room-panel" tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? keys.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + keys.length) % keys.length;
        setTab(keys[next]); document.getElementById(`room-tab-${keys[next]}`)?.focus();
      }}>{labels[key]}</button>)}</div>
    <div id="room-panel" role="tabpanel" aria-labelledby={`room-tab-${tab}`} className="room-panel">
      {tab === "problems" ? <ProblemsTab room={data} reload={room.reload} /> : tab === "leaderboard" ? <LeaderboardTab room={data} />
        : tab === "members" ? <MembersTab room={data} reload={room.reload} /> : tab === "settings" ? <SettingsTab room={data} reload={room.reload} />
          : <InviteTab room={data} reload={room.reload} />}
    </div>
    <ConfirmModal open={leaving} title="Leave this room?" confirm="Leave room" danger busy={busy} error={leaveError} onClose={() => setLeaving(false)} onConfirm={() => void leave()}>
      <p>Your solves in “{data.name}” will be cleared. You can rejoin with an invite link while the room is active.</p>
    </ConfirmModal>
  </div>;
}
export function RoomView({ code }: { code: string }) { return <RoomsGate><Room code={code} /></RoomsGate>; }
