"use client";
import type { ReactNode } from "react";
import { Info, Lock, RefreshCw, Users } from "lucide-react";
import { Badge, Button, Empty, Modal } from "./ui";
import { AuthLink } from "./auth-link";
import { useAccount } from "./account-provider";

export const GLOBAL_NOTE = "Room results don’t count toward your global leaderboard.";

export function RoomNote() {
  return <p className="room-note" role="note"><Info size={15} aria-hidden="true" />{GLOBAL_NOTE}</p>;
}
export function StatusBadge({ status, upcoming = false }: { status: "active" | "ended"; upcoming?: boolean }) {
  return <Badge kind={status === "ended" ? "" : "clean"}>{status === "ended" ? "Ended" : upcoming ? "Starts soon" : "Active"}</Badge>;
}
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="error-box stack" role="alert"><p>{message}</p>
    <div><Button variant="secondary" className="small" onClick={onRetry}><RefreshCw size={13} aria-hidden="true" />Try again</Button></div></div>;
}
export function ListSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return <div role="status" aria-label={label} className="stack">
    {Array.from({ length: rows }, (_, index) => <div key={index} className="card room-skeleton"><span className="skeleton" /><span className="skeleton" /></div>)}</div>;
}
/** Rooms need an account. Guests keep full access to everything else on the site. */
export function RoomsGate({ children, title = "Sign in to use private rooms" }: { children: ReactNode; title?: string }) {
  const account = useAccount();
  if (!account.ready) return <div className="content"><ListSkeleton label="Loading your account" rows={2} /></div>;
  if (!account.user) return <div className="content"><div className="card stack room-gate">
    <Empty icon={<Lock size={22} />} title={title}
      description="Rooms are shared practice spaces for friends, classes and teams. You can keep practising as a guest. Sign in only when you want to create or join a room."
      action={<div className="row wrap"><AuthLink className="btn" /><AuthLink signup className="btn secondary">Create an account</AuthLink></div>} />
  </div></div>;
  return <>{children}</>;
}
export function ConfirmModal({ open, title, confirm, busy = false, error = "", danger = false, onClose, onConfirm, children }: {
  open: boolean; title: string; confirm: string; busy?: boolean; error?: string; danger?: boolean; onClose: () => void; onConfirm: () => void; children: ReactNode;
}) {
  return <Modal open={open} onClose={() => { if (!busy) onClose(); }} title={title}>
    <div className="stack">{children}
      {error ? <p className="error-box" role="alert">{error}</p> : null}
      <div className="row wrap">
        <Button variant={danger ? "danger" : ""} loading={busy} onClick={onConfirm}>{confirm}</Button>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
      </div>
    </div>
  </Modal>;
}
export function MemberCount({ count, max }: { count: number; max: number }) {
  return <span className="row room-count"><Users size={14} aria-hidden="true" />{count} / {max}<span className="visually-hidden"> members</span></span>;
}
