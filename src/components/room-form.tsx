"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { RoomNote, RoomsGate } from "./rooms-ui";
import { api, localToIso, messageOf, roomPath, type RoomDetail } from "@/lib/rooms/client";

function CreateRoom() {
  const id = useId(), router = useRouter();
  const [fields, setFields] = useState({ name: "", description: "", maxMembers: 100, startsAt: "", endsAt: "", inviteExpiry: "7d" });
  const [errors, setErrors] = useState<Record<string, string>>({}), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const set = (key: keyof typeof fields, value: string | number) => { setFields(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: "" })); setMessage(""); };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (fields.name.trim().length < 3) next.name = "Use at least 3 characters for the room name.";
    if (fields.startsAt && fields.endsAt && new Date(fields.endsAt) <= new Date(fields.startsAt)) next.endsAt = "The end must be after the start.";
    if (fields.endsAt && new Date(fields.endsAt) <= new Date()) next.endsAt = "Choose an end time in the future.";
    setErrors(next);
    if (Object.keys(next).length) { document.getElementById(`${id}-${Object.keys(next)[0]}`)?.focus(); return; }
    setBusy(true); setMessage("");
    try {
      const room = await api<RoomDetail>("/api/rooms/", "POST", { name: fields.name, description: fields.description, maxMembers: fields.maxMembers,
        inviteExpiry: fields.inviteExpiry, ...(localToIso(fields.startsAt) ? { startsAt: localToIso(fields.startsAt) } : {}), ...(localToIso(fields.endsAt) ? { endsAt: localToIso(fields.endsAt) } : {}) });
      router.push(roomPath(room.code));
    } catch (cause) { setMessage(messageOf(cause)); setBusy(false); }
  }
  const field = (key: string) => errors[key] ? <small id={`${id}-${key}-error`} className="field-error" role="alert">{errors[key]}</small> : null;
  return <div className="content auth-content">
    <article className="card auth-card room-form-card">
      <header><h1>Create a room<span className="accent">.</span></h1>
        <p>Name it, choose how many people can join, then add problems and invite people with a link.</p></header>
      <RoomNote />
      <form className="auth-form" aria-label="Create room" noValidate onSubmit={submit}>
        <div className="auth-field"><label htmlFor={`${id}-name`}>Room name</label>
          <input id={`${id}-name`} value={fields.name} maxLength={60} required autoFocus disabled={busy} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-error` : undefined}
            onChange={event => set("name", event.target.value)} placeholder="Friday study group" />{field("name")}</div>
        <div className="auth-field"><label htmlFor={`${id}-description`}>Description <span className="muted">(optional)</span></label>
          <textarea id={`${id}-description`} rows={3} maxLength={500} value={fields.description} disabled={busy} onChange={event => set("description", event.target.value)}
            placeholder="What is this room for?" /></div>
        <div className="auth-field"><label htmlFor={`${id}-maxMembers`}>Maximum members: <strong>{fields.maxMembers}</strong></label>
          <input id={`${id}-maxMembers`} type="range" min={1} max={100} step={1} value={fields.maxMembers} disabled={busy} aria-describedby={`${id}-limit-help`}
            onChange={event => set("maxMembers", Number(event.target.value))} />
          <small id={`${id}-limit-help`} className="muted">Between 1 and 100, including you. You can lower or raise this later.</small></div>
        <div className="room-dates">
          <div className="auth-field"><label htmlFor={`${id}-startsAt`}>Starts <span className="muted">(optional)</span></label>
            <input id={`${id}-startsAt`} type="datetime-local" value={fields.startsAt} disabled={busy} onChange={event => set("startsAt", event.target.value)} />
            <small className="muted">Members see problems once the room starts.</small></div>
          <div className="auth-field"><label htmlFor={`${id}-endsAt`}>Ends <span className="muted">(optional)</span></label>
            <input id={`${id}-endsAt`} type="datetime-local" value={fields.endsAt} disabled={busy} aria-invalid={!!errors.endsAt} aria-describedby={errors.endsAt ? `${id}-endsAt-error` : undefined}
              onChange={event => set("endsAt", event.target.value)} />{field("endsAt")}</div>
        </div>
        <div className="auth-field"><label htmlFor={`${id}-expiry`}>Invite link lasts</label>
          <select id={`${id}-expiry`} value={fields.inviteExpiry} disabled={busy} onChange={event => set("inviteExpiry", event.target.value)}>
            <option value="1h">1 hour</option><option value="1d">1 day</option><option value="7d">7 days</option><option value="never">Never expires</option></select></div>
        {message ? <p className="error-box" role="alert" aria-live="assertive">{message}</p> : null}
        <Button type="submit" loading={busy}>{busy ? "Creating room…" : "Create room"}</Button>
      </form>
    </article>
  </div>;
}
export function RoomForm() { return <RoomsGate title="Sign in to create a room"><CreateRoom /></RoomsGate>; }
