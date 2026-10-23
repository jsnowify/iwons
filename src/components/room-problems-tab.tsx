"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CheckCircle2, CircleDashed, Pencil, Plus, Search, Trash2, CircleDot, FilePlus2, Lock } from "lucide-react";
import { Badge, Button, Empty, Modal } from "./ui";
import { ConfirmModal, ErrorRetry, ListSkeleton } from "./rooms-ui";
import { api, formatElapsed, formatWhen, messageOf, roomPath, useResource, type CatalogHit, type CustomProblem, type RoomDetail, type RoomMe, type RoomProblem } from "@/lib/rooms/client";

const statusText = { solved: "Solved", attempted: "Attempted", not_attempted: "Not attempted" } as const;
function StatusIcon({ status }: { status: keyof typeof statusText }) {
  const Icon = status === "solved" ? CheckCircle2 : status === "attempted" ? CircleDot : CircleDashed;
  return <Icon size={18} aria-hidden="true" className={status === "solved" ? "room-solved" : "muted"} />;
}

function CatalogPicker({ room, open, onClose, onAdded }: { room: RoomDetail; open: boolean; onClose: () => void; onAdded: () => void }) {
  const id = useId();
  const [query, setQuery] = useState(""), [debounced, setDebounced] = useState("");
  const [adding, setAdding] = useState<string | null>(null), [message, setMessage] = useState("");
  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 250); return () => clearTimeout(timer); }, [query]);
  const hits = useResource(() => open ? api<{ problems: CatalogHit[] }>(`/api/rooms/catalog/?q=${encodeURIComponent(debounced)}&limit=20`) : Promise.resolve({ problems: [] }), [open, debounced]);
  const listed = new Set(room.problems.map(item => item.refKey));
  async function add(hit: CatalogHit) {
    setAdding(hit.id); setMessage("");
    try { await api(`/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: hit.id }); onAdded(); }
    catch (cause) { setMessage(messageOf(cause)); } finally { setAdding(null); }
  }
  return <Modal open={open} onClose={onClose} title="Add a catalog problem">
    <div className="stack">
      <p className="muted">Catalog problems are judged on the server in JavaScript and Python. Some problems that need linked lists or trees aren’t available in rooms yet.</p>
      <label htmlFor={`${id}-search`} className="visually-hidden">Search problems</label>
      <div className="row room-search"><Search size={15} aria-hidden="true" /><input id={`${id}-search`} type="search" value={query} maxLength={80} placeholder="Search by title or topic" autoFocus onChange={event => setQuery(event.target.value)} /></div>
      {message ? <p className="error-box" role="alert">{message}</p> : null}
      <div aria-live="polite" aria-busy={hits.loading}>
        {hits.loading && !hits.data ? <ListSkeleton label="Searching problems" rows={3} />
          : hits.error ? <ErrorRetry message={hits.error} onRetry={hits.reload} />
            : !hits.data?.problems.length ? <p className="muted">No problems match “{debounced}”. Try another word.</p>
              : <ul className="room-picker" aria-label="Matching problems">{hits.data.problems.map(hit => <li key={hit.id} className="between">
                <span><strong>{hit.title}</strong> <Badge kind={hit.difficulty}>{hit.difficulty}</Badge></span>
                {listed.has(`c-${hit.id}`) ? <Badge>In room</Badge>
                  : <Button variant="secondary" className="small" loading={adding === hit.id} disabled={!!adding} onClick={() => void add(hit)} aria-label={`Add ${hit.title}`}><Plus size={13} aria-hidden="true" />Add</Button>}
              </li>)}</ul>}
      </div>
    </div>
  </Modal>;
}

function HostTools({ room, onChanged }: { room: RoomDetail; onChanged: () => void }) {
  const custom = useResource(() => api<{ problems: CustomProblem[] }>(`/api/rooms/${room.code}/custom-problems/`), [room.code, room.problemCount]);
  const [picker, setPicker] = useState(false), [busy, setBusy] = useState<string | null>(null), [error, setError] = useState("");
  const ended = room.status === "ended";
  async function publish(item: CustomProblem) {
    setBusy(item.id); setError("");
    try { await api(`/api/rooms/${room.code}/problems/`, "POST", { source: "custom", customProblemId: item.id }); onChanged(); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(null); }
  }
  return <section className="card stack room-host-tools" aria-label="Host tools">
    <div className="between wrap"><h3>Manage problems</h3>
      <div className="row wrap">
        <Button variant="secondary" className="small" disabled={ended} onClick={() => setPicker(true)}><Plus size={13} aria-hidden="true" />Add catalog problem</Button>
        {ended ? <Button variant="secondary" className="small" disabled><FilePlus2 size={13} aria-hidden="true" />Create custom problem</Button>
          : <Link href={roomPath(room.code, "custom/new/")} className="btn secondary small"><FilePlus2 size={13} aria-hidden="true" />Create custom problem</Link>}
      </div></div>
    {error ? <p className="error-box" role="alert">{error}</p> : null}
    {custom.loading && !custom.data ? <ListSkeleton label="Loading custom problems" rows={1} />
      : custom.error && !custom.data ? <ErrorRetry message={custom.error} onRetry={custom.reload} />
        : custom.data?.problems.length ? <ul className="room-picker" aria-label="Your custom problems">{custom.data.problems.map(item => <li key={item.id} className="between wrap">
          <span><strong>{item.title}</strong> <Badge kind={item.difficulty}>{item.difficulty}</Badge> {item.validated ? <Badge kind="clean">Validated</Badge> : <Badge kind="medium">Needs validation</Badge>}
            {item.testsLocked ? <Badge><Lock size={11} aria-hidden="true" /> Tests locked</Badge> : null}</span>
          <span className="row wrap">
            <Link href={roomPath(room.code, `custom/${item.id}/`)} className="btn ghost small"><Pencil size={13} aria-hidden="true" />{item.validated ? "View" : "Edit and validate"}</Link>
            {item.inRoom ? <Badge>In room</Badge> : <Button variant="secondary" className="small" disabled={!item.validated || ended} loading={busy === item.id} onClick={() => void publish(item)}
              title={item.validated ? undefined : "Validate with a reference solution first"}>Add to room</Button>}
          </span></li>)}</ul>
          : <p className="muted">No custom problems yet. Write your own with test cases and a reference solution.</p>}
    <CatalogPicker room={room} open={picker} onClose={() => setPicker(false)} onAdded={() => { setPicker(false); onChanged(); }} />
  </section>;
}

export function ProblemsTab({ room, reload }: { room: RoomDetail; reload: () => void }) {
  const me = useResource(() => api<RoomMe>(`/api/rooms/${room.code}/me/`), [room.code, room.problems.length, room.started]);
  const [removing, setRemoving] = useState<RoomProblem | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const isHost = room.role === "host";
  const status = new Map(me.data?.problems.map(item => [item.refKey, item]));
  async function remove() {
    if (!removing) return;
    setBusy(true); setError("");
    try { await api(`/api/rooms/${room.code}/problems/${removing.refKey}/`, "DELETE"); setRemoving(null); reload(); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <div className="stack">
    {isHost ? <HostTools room={room} onChanged={reload} /> : null}
    {!room.started && !isHost ? <Empty icon={<CircleDashed size={22} />} title="This room hasn’t started yet."
      description={room.startsAt ? `Problems appear on ${formatWhen(room.startsAt)}. ${room.problemCount} ${room.problemCount === 1 ? "problem is" : "problems are"} waiting.` : "Problems appear when the host starts the room."} />
      : !room.problems.length ? <Empty icon={<CircleDashed size={22} />} title="No problems yet." description={isHost ? "Add a catalog problem or write your own to get started." : "The host hasn’t added any problems yet. Check back soon."} />
        : <ol className="room-problems" aria-label="Room problems">{room.problems.map(problem => {
          const mine = status.get(problem.refKey), current = mine?.status ?? "not_attempted";
          return <li key={problem.refKey} className="card room-problem">
            <Link href={roomPath(room.code, `problems/${problem.refKey}/`)} className="room-problem-link">
              <StatusIcon status={current} /><span className="room-problem-title"><span className="muted">{problem.order}.</span> {problem.title}</span>
              <span className="row wrap"><Badge kind={problem.difficulty}>{problem.difficulty}</Badge>{problem.source === "custom" ? <Badge>Custom</Badge> : null}
                <span className={current === "solved" ? "room-solved" : "muted"}>{statusText[current]}{mine?.elapsedMs != null ? ` · ${formatElapsed(mine.elapsedMs)}` : ""}</span></span>
            </Link>
            {isHost ? <Button variant="ghost" className="small" disabled={problem.locked || room.status === "ended"} onClick={() => { setError(""); setRemoving(problem); }}
              aria-label={`Remove ${problem.title}`} title={problem.locked ? "Someone already submitted, so this can’t be removed" : "Remove from room"}><Trash2 size={14} aria-hidden="true" /></Button> : null}
          </li>;
        })}</ol>}
    {me.error && !me.data ? <ErrorRetry message={me.error} onRetry={me.reload} /> : null}
    <ConfirmModal open={!!removing} title="Remove this problem?" confirm="Remove problem" danger busy={busy} error={error} onClose={() => setRemoving(null)} onConfirm={() => void remove()}>
      <p>“{removing?.title}” will disappear from the room. This only works until someone submits to it.</p>
    </ConfirmModal>
  </div>;
}
