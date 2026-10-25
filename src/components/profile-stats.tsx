"use client";
import { useMemo } from "react";
import { useStore } from "@/store/use-store";
import { countedVerdicts, difficulties, profileStats } from "@/lib/profile-stats";
import { verdictNames } from "@/lib/presentation";
import type { Difficulty } from "@/lib/types";

const tone: Record<Difficulty, string> = { easy: "var(--accent-3)", medium: "var(--accent-2)", hard: "var(--accent)" };
const verdictTone: Record<(typeof countedVerdicts)[number], string> = {
  accepted: "var(--success)", wrong_answer: "var(--danger)", time_limit: "var(--warning)",
  runtime_error: "var(--accent-4)", compile_error: "var(--muted)",
};
const R = 52, C = 2 * Math.PI * R;

export type CatalogLevel = { id: string; difficulty: Difficulty };

/** Solved ring by difficulty plus a LeetCode-style acceptance breakdown. */
export function ProfileStats({ catalog }: { catalog: CatalogLevel[] }) {
  const submissions = useStore((s) => s.submissions), progress = useStore((s) => s.progress), hydrated = useStore((s) => s.hydrated);
  const stats = useMemo(() => profileStats(submissions, progress, catalog), [submissions, progress, catalog]);
  if (!hydrated) return <div className="skeleton" style={{ height: 320 }} role="status" aria-label="Loading your stats" />;
  const lengths = difficulties.map((d) => (stats.problemTotal ? (stats.solved[d] / stats.problemTotal) * C : 0));
  const arcs = difficulties.map((d, i) => ({ d, length: lengths[i], offset: lengths.slice(0, i).reduce((sum, n) => sum + n, 0) }));
  return <>
    <section className="card stat-block" aria-labelledby="solved-heading">
      <h2 id="solved-heading">Solved</h2>
      <div className="solved-layout">
        <div className="solved-ring">
          <svg viewBox="0 0 120 120" role="img" aria-label={`${stats.solvedTotal} of ${stats.problemTotal} problems solved`}>
            <circle className="ring-track" cx="60" cy="60" r={R} />
            {arcs.map(({ d, length, offset: start }) => length > 0 ? <circle key={d} className="ring-arc" cx="60" cy="60" r={R}
              style={{ stroke: tone[d] }} strokeDasharray={`${length} ${C - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" /> : null)}
          </svg>
          <div className="ring-label"><strong>{stats.solvedTotal}</strong><small>/ {stats.problemTotal}</small></div>
        </div>
        <ul className="diff-list">
          {difficulties.map((d) => <li key={d}>
            <span className="diff-name">{d[0].toUpperCase() + d.slice(1)}</span>
            <span className="diff-count"><strong>{stats.solved[d]}</strong>/{stats.totals[d]}</span>
            <span className="diff-bar" aria-hidden="true"><i style={{ width: `${stats.totals[d] ? (stats.solved[d] / stats.totals[d]) * 100 : 0}%`, background: tone[d] }} /></span>
          </li>)}
        </ul>
      </div>
    </section>
    <section className="card stat-block" aria-labelledby="accept-heading">
      <h2 id="accept-heading">Submissions</h2>
      {stats.attempts ? <>
        <div className="accept-top">
          <div><strong>{stats.acceptance}%</strong><small>Acceptance rate</small></div>
          <div><strong>{stats.accepted}<span className="muted">/{stats.attempts}</span></strong><small>Accepted / total</small></div>
          <div><strong>{stats.firstTryRate}%</strong><small>Solved first try</small></div>
        </div>
        <div className="verdict-bar" role="img" aria-label={countedVerdicts.map((v) => `${stats.verdicts[v]} ${verdictNames[v]}`).join(", ")}>
          {countedVerdicts.filter((v) => stats.verdicts[v]).map((v) =>
            <i key={v} style={{ flexGrow: stats.verdicts[v], background: verdictTone[v] }} />)}
        </div>
        <ul className="verdict-legend">
          {countedVerdicts.map((v) => <li key={v}><i style={{ background: verdictTone[v] }} aria-hidden="true" />
            <span>{verdictNames[v]}</span><strong>{stats.verdicts[v]}</strong></li>)}
        </ul>
      </> : <p className="muted">No submissions yet. Your acceptance rate and verdict breakdown appear after your first submit.</p>}
    </section>
  </>;
}
