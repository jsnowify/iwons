"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Crown, Medal, RefreshCw, Trophy, UserMinus } from "lucide-react";
import { Badge, Button, Empty } from "./ui";
import { CopyButton } from "./judge-ui";
import { ConfirmModal, ErrorRetry, ListSkeleton } from "./rooms-ui";
import { api, formatElapsed, formatWhen, inviteUrl, isoToLocal, localToIso, messageOf, roomPath, useResource, type Board, type BoardRow, type RoomDetail, type RoomMember } from "@/lib/rooms/client";

function BoardRowItem({ row, started }: { row: BoardRow; started: boolean }) {
  return <li className={`board-row ${row.isYou ? "you" : ""} ${row.rank <= 3 ? `top top-${row.rank}` : ""}`} aria-current={row.isYou ? "true" : undefined}>
    <span className="board-rank">{row.rank <= 3 ? <Medal size={15} aria-hidden="true" /> : null}<span className="visually-hidden">Rank </span>#{row.rank}</span>
    <span className="board-who"><span className="avatar" aria-hidden="true">{Array.from(row.displayName)[0]?.toUpperCase() ?? "?"}</span>
      <span className="room-who"><strong>{row.displayName}</strong><small className="muted">@{row.username}</small></span>{row.isYou ? <span className="badge you-badge">You</span> : null}</span>
    <span className="board-nums">
      <span className="board-num">{row.solved}<small> solved</small></span>
      <span className="board-num" title={row.lastAcceptedAt ? `Last accepted ${formatWhen(row.lastAcceptedAt)}` : undefined}>{formatElapsed(row.elapsedMs)}<small> {started ? "since start" : "after opening"}</small></span>
    </span>
  </li>;
}

export function LeaderboardTab({ room }: { room: RoomDetail }) {
  const first = useResource(() => api<Board>(`/api/rooms/${room.code}/leaderboard/?limit=50`), [room.code]);
  const [extra, setExtra] = useState<BoardRow[]>([]), [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [more, setMore] = useState(false), [moreError, setMoreError] = useState("");
  // Standings change as people solve, so the first page refreshes quietly while the tab is visible.
  const { reload } = first;
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") reload(); }, 30_000);
    return () => clearInterval(timer);
  }, [reload]);
  useEffect(() => { setExtra([]); setCursor(undefined); }, [first.data]);
  const nextCursor = cursor === undefined ? first.data?.nextCursor ?? null : cursor;
  const rows = [...(first.data?.rows ?? []), ...extra];
  async function loadMore() {
    if (!nextCursor) return;
    setMore(true); setMoreError("");
    try {
      const page = await api<Board>(`/api/rooms/${room.code}/leaderboard/?limit=50&cursor=${encodeURIComponent(nextCursor)}`);
      setExtra(current => [...current, ...page.rows]); setCursor(page.nextCursor);
    } catch (cause) { setMoreError(messageOf(cause)); } finally { setMore(false); }
  }
  const you = first.data?.you, youShown = !you || rows.some(row => row.isYou);
  return <div className="stack" id="room-leaderboard">
    <div className="between wrap"><h3>Room leaderboard</h3>
      <Button variant="ghost" className="small" loading={first.loading && !!first.data} onClick={first.reload}><RefreshCw size={13} aria-hidden="true" />Refresh</Button></div>
    <p className="muted room-rules">Ranked by problems solved, then by who finished earlier. Times are measured from the room’s start.</p>
    <div aria-live="polite" aria-busy={first.loading}>
      {first.loading && !first.data ? <ListSkeleton label="Loading the leaderboard" />
        : first.error && !first.data ? <ErrorRetry message={first.error} onRetry={first.reload} />
          : !rows.length ? <Empty icon={<Trophy size={22} />} title="No solves yet. Be the first." description="Solve a problem and your name shows up here." action={<Link href={roomPath(room.code)} className="btn secondary small">See the problems</Link>} />
            : <ol className="board-list" aria-label="Room rankings">{rows.map(row => <BoardRowItem key={row.username} row={row} started={room.started} />)}</ol>}
    </div>
    {first.error && first.data ? <p className="error-box" role="alert">{first.error} Showing the last standings we loaded.</p> : null}
    {moreError ? <p className="error-box" role="alert">{moreError}</p> : null}
    {nextCursor ? <div><Button variant="secondary" loading={more} onClick={() => void loadMore()}>Show more</Button></div> : null}
    {you && !youShown ? <div className="board-own room-you-sticky" role="note" aria-label="Your position"><BoardRowItem row={you} started={room.started} /></div> : null}
    {!you && first.data ? <p className="muted">You haven’t solved a problem here yet, so you’re not ranked.</p> : null}
  </div>;
}

export function MembersTab({ room, reload }: { room: RoomDetail; reload: () => void }) {
  const members = useResource(() => api<{ members: RoomMember[] }>(`/api/rooms/${room.code}/members/`), [room.code, room.memberCount]);
  const [target, setTarget] = useState<RoomMember | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const isHost = room.role === "host";
  async function kick() {
    if (!target?.userId) return;
    setBusy(true); setError("");
    try { await api(`/api/rooms/${room.code}/members/${encodeURIComponent(target.userId)}/kick/`, "POST"); setTarget(null); reload(); members.reload(); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <div className="stack">
    <h3>Members <small className="muted">({room.memberCount} of {room.maxMembers})</small></h3>
    <div aria-live="polite" aria-busy={members.loading}>
      {members.loading && !members.data ? <ListSkeleton label="Loading members" />
        : members.error && !members.data ? <ErrorRetry message={members.error} onRetry={members.reload} />
          : <ul className="room-members" aria-label="Room members">{members.data?.members.map(member => <li key={member.username} className="card between wrap">
            <span className="board-who"><span className="avatar" aria-hidden="true">{Array.from(member.displayName)[0]?.toUpperCase() ?? "?"}</span>
              <span className="room-who"><strong>{member.displayName}</strong><small className="muted">@{member.username} · joined {formatWhen(member.joinedAt)}</small></span>
              {member.role === "host" ? <Badge><Crown size={11} aria-hidden="true" /> Host</Badge> : null}{member.isYou ? <Badge>You</Badge> : null}</span>
            {isHost && member.role !== "host" && room.status === "active" ? <Button variant="ghost" className="small" onClick={() => { setError(""); setTarget(member); }} aria-label={`Remove ${member.displayName}`}>
              <UserMinus size={14} aria-hidden="true" />Remove</Button> : null}
          </li>)}</ul>}
    </div>
    <ConfirmModal open={!!target} title="Remove this member?" confirm="Remove member" danger busy={busy} error={error} onClose={() => setTarget(null)} onConfirm={() => void kick()}>
      <p>{target?.displayName} will lose access to the room and their solves here will be cleared. They can only come back with a new invite link.</p>
    </ConfirmModal>
  </div>;
}

export function SettingsTab({ room, reload }: { room: RoomDetail; reload: () => void }) {
  const id = useId();
  const [fields, setFields] = useState({ name: room.name, description: room.description, maxMembers: room.maxMembers, startsAt: isoToLocal(room.startsAt), endsAt: isoToLocal(room.endsAt) });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [saved, setSaved] = useState(""), [ending, setEnding] = useState(false), [endError, setEndError] = useState("");
  const ended = room.status === "ended";
  const set = (key: keyof typeof fields, value: string | number) => { setFields(current => ({ ...current, [key]: value })); setSaved(""); setMessage(""); };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (fields.name.trim().length < 3) { setMessage("Use at least 3 characters for the room name."); return; }
    setBusy(true); setMessage(""); setSaved("");
    try {
      await api(`/api/rooms/${room.code}/`, "PATCH", { name: fields.name, description: fields.description, maxMembers: fields.maxMembers,
        startsAt: localToIso(fields.startsAt) ?? null, endsAt: localToIso(fields.endsAt) ?? null });
      setSaved("Settings saved."); reload();
    } catch (cause) { setMessage(messageOf(cause)); } finally { setBusy(false); }
  }
  async function end() {
    setBusy(true); setEndError("");
    try { await api(`/api/rooms/${room.code}/`, "PATCH", { status: "ended" }); setEnding(false); reload(); }
    catch (cause) { setEndError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <div className="stack">
    <form className="card auth-form" aria-label="Room settings" noValidate onSubmit={save}>
      <h3>Room settings</h3>
      <div className="auth-field"><label htmlFor={`${id}-name`}>Room name</label><input id={`${id}-name`} value={fields.name} maxLength={60} disabled={ended || busy} onChange={event => set("name", event.target.value)} /></div>
      <div className="auth-field"><label htmlFor={`${id}-description`}>Description</label><textarea id={`${id}-description`} rows={3} maxLength={500} value={fields.description} disabled={ended || busy} onChange={event => set("description", event.target.value)} /></div>
      <div className="auth-field"><label htmlFor={`${id}-max`}>Maximum members: <strong>{fields.maxMembers}</strong></label>
        <input id={`${id}-max`} type="range" min={1} max={100} value={fields.maxMembers} disabled={ended || busy} onChange={event => set("maxMembers", Number(event.target.value))} />
        <small className="muted">{room.memberCount} {room.memberCount === 1 ? "person has" : "people have"} joined. You can’t go below that.</small></div>
      <div className="room-dates">
        <div className="auth-field"><label htmlFor={`${id}-start`}>Starts</label><input id={`${id}-start`} type="datetime-local" value={fields.startsAt} disabled={ended || busy} onChange={event => set("startsAt", event.target.value)} /></div>
        <div className="auth-field"><label htmlFor={`${id}-end`}>Ends</label><input id={`${id}-end`} type="datetime-local" value={fields.endsAt} disabled={ended || busy} onChange={event => set("endsAt", event.target.value)} /></div>
      </div>
      {message ? <p className="error-box" role="alert">{message}</p> : null}
      <p className="success" role="status">{saved}</p>
      <div><Button type="submit" loading={busy} disabled={ended}>Save settings</Button></div>
    </form>
    <section className="card stack" aria-label="End room">
      <h3>End this room</h3>
      <p className="muted">Ending stops new submissions. Members keep read-only access for 90 days, then the room is deleted. You can’t reopen it.</p>
      <div><Button variant="danger" disabled={ended} onClick={() => { setEndError(""); setEnding(true); }}>{ended ? "Room ended" : "End room"}</Button></div>
    </section>
    <ConfirmModal open={ending} title="End this room?" confirm="End room" danger busy={busy} error={endError} onClose={() => setEnding(false)} onConfirm={() => void end()}>
      <p>No one will be able to submit after this. The leaderboard stays visible for 90 days.</p>
    </ConfirmModal>
  </div>;
}

export function InviteTab({ room, reload }: { room: RoomDetail; reload: () => void }) {
  const id = useId(), invite = room.invite;
  const [expiry, setExpiry] = useState("7d"), [confirming, setConfirming] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState("");
  const link = invite && typeof location !== "undefined" ? inviteUrl(invite.token) : "";
  const expired = !!invite?.expiresAt && new Date(invite.expiresAt) <= new Date();
  const seats = room.maxMembers - room.memberCount;
  async function regenerate() {
    setBusy(true); setError("");
    try { await api(`/api/rooms/${room.code}/invite/regenerate/`, "POST", { expiry }); setConfirming(false); setDone("New link created. The old one no longer works."); reload(); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <div className="stack">
    <section className="card stack" aria-label="Invite link">
      <h3>Invite link</h3>
      <p className="muted">Anyone with this link can join after signing in, until the room is full. {seats > 0 ? `${seats} ${seats === 1 ? "seat is" : "seats are"} left.` : "The room is full."}</p>
      <label htmlFor={`${id}-link`} className="visually-hidden">Invite link</label>
      <div className="row room-link"><input id={`${id}-link`} readOnly value={link} onFocus={event => event.currentTarget.select()} aria-describedby={`${id}-expires`} /><CopyButton text={link} label="Copy link" /></div>
      <p id={`${id}-expires`} className={expired ? "error-text" : "muted"}>{invite?.expiresAt ? (expired ? `This link expired on ${formatWhen(invite.expiresAt)}. Create a new one.` : `Expires ${formatWhen(invite.expiresAt)}.`) : "This link never expires."}</p>
      <p className="success" role="status">{done}</p>
    </section>
    <section className="card stack" aria-label="Create a new link">
      <h3>Create a new link</h3>
      <p className="muted">Use this if the link was shared too widely or removed members need a way back. The old link stops working immediately.</p>
      <div className="row wrap"><label htmlFor={`${id}-expiry`}>New link lasts</label>
        <select id={`${id}-expiry`} value={expiry} disabled={busy || room.status === "ended"} onChange={event => setExpiry(event.target.value)}>
          <option value="1h">1 hour</option><option value="1d">1 day</option><option value="7d">7 days</option><option value="never">Never expires</option></select>
        <Button variant="secondary" disabled={room.status === "ended"} onClick={() => { setError(""); setConfirming(true); }}>Regenerate link</Button></div>
    </section>
    <ConfirmModal open={confirming} title="Replace the invite link?" confirm="Regenerate link" danger busy={busy} error={error} onClose={() => setConfirming(false)} onConfirm={() => void regenerate()}>
      <p>The old link stops working. People who haven’t joined yet will need the new one.</p>
    </ConfirmModal>
  </div>;
}
