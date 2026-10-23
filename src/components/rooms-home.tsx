"use client";
import Link from "next/link";
import { useState } from "react";
import { DoorOpen, Plus } from "lucide-react";
import { Badge, Empty } from "./ui";
import { ErrorRetry, ListSkeleton, MemberCount, RoomNote, RoomsGate, StatusBadge } from "./rooms-ui";
import { api, formatWhen, roomPath, useResource, type RoomSummary } from "@/lib/rooms/client";

const tabs = [["host", "Hosting"], ["member", "Joined"]] as const;

function RoomCard({ room }: { room: RoomSummary }) {
  const upcoming = room.status === "active" && !!room.startsAt && new Date(room.startsAt) > new Date();
  return <li><Link href={roomPath(room.code)} className="card room-card">
    <span className="between wrap">
      <strong className="room-card-name">{room.name}</strong>
      <span className="row"><StatusBadge status={room.status} upcoming={upcoming} />{room.role === "host" ? <Badge>Host</Badge> : null}</span>
    </span>
    <span className="row wrap muted room-card-meta">
      <span>Hosted by {room.hostName}</span><MemberCount count={room.memberCount} max={room.maxMembers} />
      <span>{room.problemCount} {room.problemCount === 1 ? "problem" : "problems"}</span>
      {upcoming ? <span>Starts {formatWhen(room.startsAt)}</span> : room.endsAt && room.status === "active" ? <span>Ends {formatWhen(room.endsAt)}</span> : null}
    </span>
  </Link></li>;
}

function Rooms() {
  const rooms = useResource(() => api<{ rooms: RoomSummary[] }>("/api/rooms/mine/"), []);
  const [chosen, setChosen] = useState<"host" | "member" | null>(null);
  const all = rooms.data?.rooms ?? [];
  const count = (role: string) => all.filter(room => room.role === role).length;
  // Someone who only joined rooms should land on those, not on an empty "Hosting" list.
  const tab = chosen ?? (count("host") === 0 && count("member") > 0 ? "member" : "host");
  const setTab = setChosen;
  const shown = all.filter(room => room.role === tab);
  return <div className="content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">PRACTISE TOGETHER.</div>
        <h1>Private rooms<span className="accent">.</span></h1>
        <p>Invite friends, a class or a team. Pick the problems, then watch the room’s own leaderboard.</p>
      </div>
      <Link href="/rooms/new/" className="btn"><Plus size={14} aria-hidden="true" />Create room</Link>
    </div>
    <RoomNote />
    <div className="tabs" role="tablist" aria-label="Your rooms">{tabs.map(([key, name], index) => <button key={key} id={`rooms-tab-${key}`} role="tab"
      className={`tab ${tab === key ? "active" : ""}`} aria-selected={tab === key} aria-controls="rooms-list" tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}
      onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault(); const next = tabs[(index + 1) % tabs.length][0]; setTab(next); document.getElementById(`rooms-tab-${next}`)?.focus();
      }}>{name}{rooms.data ? <small> ({count(key)})</small> : null}</button>)}</div>
    <div id="rooms-list" role="tabpanel" aria-labelledby={`rooms-tab-${tab}`} aria-busy={rooms.loading} className="stack room-panel">
      {rooms.loading && !rooms.data ? <ListSkeleton label="Loading your rooms" />
        : rooms.error && !rooms.data ? <ErrorRetry message={rooms.error} onRetry={rooms.reload} />
          : !shown.length ? <Empty icon={<DoorOpen size={22} />} title={tab === "host" ? "You’re not hosting a room yet." : "You haven’t joined a room yet."}
            description={tab === "host" ? "Create a room, add problems and share the invite link." : "Open an invite link from a friend or host to join their room."}
            action={tab === "host" ? <Link href="/rooms/new/" className="btn secondary small">Create your first room</Link> : undefined} />
            : <ul className="room-list" aria-label={tab === "host" ? "Rooms you host" : "Rooms you joined"}>{shown.map(room => <RoomCard key={room.code} room={room} />)}</ul>}
    </div>
  </div>;
}
export function RoomsHome() { return <RoomsGate><Rooms /></RoomsGate>; }
