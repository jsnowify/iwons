"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { AVATAR_HELP, AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/lib/accounts/avatar-policy";
import { useAccount } from "./account-provider";
import { AccountAvatar } from "./account-avatar";
import { Button } from "./ui";

const savedPhoto = z.object({ avatarUrl: z.string().nullable() }).strict();
export function AvatarEditor() {
  const account = useAccount(), id = useId();
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState<"save" | "remove" | null>(null), [message, setMessage] = useState(""), [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null), abort = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!file) { setPreview(undefined); return; }
    const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => abort.current?.abort(), []);
  function clear() { setFile(null); if (input.current) input.current.value = ""; }
  async function save(remove = false) {
    if (busy || !account.user || !remove && !file) return;
    setBusy(remove ? "remove" : "save"); setError(""); setMessage("");
    const controller = new AbortController(); abort.current = controller; let persisted = false;
    try {
      const response = await fetch("/api/me/avatar/", { method: remove ? "DELETE" : "PUT", credentials: "same-origin",
        headers: { "X-Iwons-Account": account.user.id, ...(remove ? {} : { "Content-Type": file!.type }) },
        body: remove ? undefined : file, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      const data: unknown = await response.json();
      if (!response.ok) { const issue = z.object({ error: z.string() }).safeParse(data); throw new Error(issue.success ? issue.data.error : "Your photo could not be saved. Try again."); }
      savedPhoto.parse(data); persisted = true;
      await account.refreshIdentity(); clear(); setMessage(remove ? "Photo removed. Your initial is back." : "Profile photo saved.");
    } catch (cause) {
      if (!controller.signal.aborted) setError(persisted ? "Your photo was saved. Reload to refresh your profile." : cause instanceof Error ? cause.message : "Your photo could not be saved. Try again.");
    } finally { if (!controller.signal.aborted) setBusy(null); abort.current = null; }
  }
  if (!account.user) return null;
  return <section className="avatar-editor" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>Profile photo <span className="muted">(optional)</span></h2>
    <p className="muted">Add a photo for your profile, sidebar, and account menu. You can remove it whenever you like.</p>
    {preview ? <span className="avatar avatar-photo profile-avatar">
      <Image src={preview} width={256} height={256} alt="Your new profile picture preview" unoptimized />
    </span> : <AccountAvatar initial={account.user.avatar} url={account.user.avatarUrl} className="profile-avatar" />}
    <div className="auth-field">
      <label htmlFor={`${id}-file`}>Choose a photo</label>
      <input ref={input} id={`${id}-file`} type="file" accept={AVATAR_TYPES.join(",")} disabled={!!busy} aria-describedby={`${id}-help`} onChange={event => {
        const next = event.target.files?.[0] ?? null; setError(""); setMessage("");
        if (next && (!AVATAR_TYPES.includes(next.type) || next.size > AVATAR_MAX_BYTES || !next.size)) {
          clear(); setError("Choose a JPG, PNG, or WebP photo up to 2 MB."); return;
        }
        setFile(next);
      }} />
      <small id={`${id}-help`} className="muted">{AVATAR_HELP}</small>
    </div>
    <div className="avatar-actions">
      <Button type="button" disabled={!file || !!busy} loading={busy === "save"} onClick={() => void save()}>{busy === "save" ? "Saving photo…" : "Save photo"}</Button>
      {file ? <Button type="button" variant="secondary" disabled={!!busy} onClick={clear}>Cancel</Button> : null}
      {account.user.avatarUrl ? <Button type="button" variant="secondary" disabled={!!busy} loading={busy === "remove"} onClick={() => void save(true)}>{busy === "remove" ? "Removing…" : "Remove photo"}</Button> : null}
    </div>
    {error ? <p className="error-box" role="alert">{error}</p> : null}
    {message ? <p className="success" role="status">{message}</p> : null}
  </section>;
}
