"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { BadgeCheck, HardDrive, ArrowUpRight, Info } from "lucide-react";
import { useStore } from "@/store/use-store";
import { getStats } from "@/lib/stats";
import { languageNames, serverDemo } from "@/lib/presentation";
import { Badge, Empty, ProgressBar } from "./ui";
import { useAccount } from "./account-provider";
import { SoftPrompt } from "./soft-prompt";
import { verdictMeta } from "./judge-ui";
import { ImportedVerification } from "./imported-verification";

const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(at: number) {
  const minutes = Math.round((at - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  if (Math.abs(minutes) < 60 * 24) return relative.format(Math.round(minutes / 60), "hour");
  return relative.format(Math.round(minutes / (60 * 24)), "day");
}

export function SolveKindBadge({ verified }: { verified: boolean }) {
  return verified ? <Badge kind="clean"><BadgeCheck size={12} aria-hidden="true" />Verified</Badge>
    : <Badge><HardDrive size={12} aria-hidden="true" />Local</Badge>;
}

/** Personal summary at the top of the progress page: milestone, solve kinds and recent attempts. */
export function ProfileOverview({ problems }: { problems: { id: string; title: string }[] }) {
  const account = useAccount();
  const submissions = useStore(state => state.submissions), progress = useStore(state => state.progress), hydrated = useStore(state => state.hydrated);
  const [explain, setExplain] = useState(false);
  const explanation = useId();
  const { solved, verified, thisMonth } = useMemo(() => {
    const stats = getStats(submissions, progress);
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    return { solved: stats.solved,
      verified: new Set(stats.accepted.filter(item => item.source === "server").map(item => item.problemId)),
      thisMonth: new Set(stats.accepted.filter(item => item.at >= month.getTime()).map(item => item.problemId)).size };
  }, [submissions, progress]);
  const titles = useMemo(() => new Map([...problems.map(item => [item.id, item.title] as const), [serverDemo.id, serverDemo.title]]), [problems]);
  if (!hydrated) return <div className="skeleton" style={{ height: 160, marginBottom: 28 }} role="status" aria-label="Loading your progress" />;
  const next = milestones.find(value => value > solved.size) ?? solved.size;
  const local = solved.size - verified.size;
  const recent = submissions.slice(0, 5);

  return <div className="profile-overview">
    {solved.size ? <SoftPrompt /> : null}
    <div className="dash-grid">
      <section className="card" aria-labelledby="milestone-heading">
        <div className="card-heading"><h2 id="milestone-heading">Next milestone</h2>
          <span className="eyebrow">{account.user ? (account.user.handle ? `@${account.user.handle}` : account.user.name) : "Guest"}</span></div>
        {solved.size ? <>
          <div className="stat-value">{solved.size}<span> solved</span></div>
          <ProgressBar value={(solved.size / next) * 100} label={`Progress toward ${next} solved`} />
          <p className="muted milestone-copy">{next > solved.size ? `${next - solved.size} more to reach ${next}.` : "Every milestone reached. Impressive."}
            {thisMonth ? ` You solved ${thisMonth} this month.` : ""}</p>
        </> : <Empty title="Your first solve is waiting." description="Pick any problem. Every attempt teaches something, even the ones that don’t pass yet."
          action={<Link className="btn small" href="/problems/">Browse problems</Link>} />}
        <div className="solve-kinds">
          <span className="row"><SolveKindBadge verified /><strong>{verified.size}</strong></span>
          <span className="row"><SolveKindBadge verified={false} /><strong>{local}</strong></span>
          <button type="button" className="btn ghost small" aria-expanded={explain} aria-controls={explanation} onClick={() => setExplain(!explain)}>
            <Info size={13} aria-hidden="true" />What’s the difference?</button>
        </div>
        <p id={explanation} className="muted solve-kinds-help" hidden={!explain}>
          Verified solves were checked by our server judge; when you’re signed in and have joined the optional leaderboard, those are the ones that count there. Local solves were checked in your browser or imported from a device. Both count toward your personal progress.
        </p>
        <ImportedVerification />
      </section>
      <section className="card" aria-labelledby="recent-heading">
        <div className="card-heading"><h2 id="recent-heading">Recent attempts</h2>
          <Link className="text-link" href="/submissions/">All submissions <ArrowUpRight size={11} aria-hidden="true" /></Link></div>
        {recent.length ? <ul className="recent-list">{recent.map(item => {
          const meta = verdictMeta[item.verdict];
          return <li key={item.id}>
            <meta.icon size={15} className={meta.tone === "info" ? "muted" : meta.tone} aria-hidden="true" />
            <span className="recent-title">{titles.get(item.problemId) ?? item.problemId}</span>
            <span className={`recent-verdict ${meta.tone}`}>{item.verdict === "accepted" ? "Accepted" : meta.tag}</span>
            <span className="muted">{languageNames[item.language]}</span>
            <time className="muted" dateTime={new Date(item.at).toISOString()}>{ago(item.at)}</time>
          </li>;
        })}</ul> : <Empty title="No attempts yet." description="Your recent runs and submissions will show up here." />}
      </section>
    </div>
  </div>;
}
