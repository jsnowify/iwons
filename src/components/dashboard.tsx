"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics" | "patterns">;
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  ShieldCheck,
  CheckCheck,
  Zap,
  Code2,
  CalendarDays,
  RotateCcw,
  Terminal,
  ChartNoAxesCombined,
  Sun,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useStore } from "@/store/use-store";
import { problemUrl, verdictNames } from "@/lib/presentation";
import { getStats } from "@/lib/stats";
import { isLevelUnlocked } from "@/lib/path";
import { Heatmap } from "./heatmap";
import { Badge, Empty, ProgressBar } from "./ui";
import { Onboarding } from "./onboarding";
export function Dashboard({problems}:{problems:CatalogEntry[]}) {
  const topics = [...new Set(problems.flatMap(p=>p.topics))];
  const store = useStore();
  const stats = getStats(store.submissions, store.progress);
  const [onboard, setOnboard] = useState(false);
  const available = problems.filter((p) =>
    isLevelUnlocked(p.level, store.progress, store.settings.freeBrowse),
  );
  const daily =
    available[
      (store.hydrated ? Math.floor(Date.now() / 86400000) : 0) %
        available.length
    ];
  const last = [...problems, ...store.customProblems].find(
    (p) => p.slug === store.sessions.lastProblem,
  );
  const due = store.srs.filter((r) => r.due <= Date.now());
  const date = store.hydrated
    ? new Date().toLocaleDateString("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "YOUR PRACTICE SPACE";
  return (
    <div className="content fade-in">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE INK IS STILL FRESH.</div>
          <h1>
            Back at your desk<span className="accent">.</span>
          </h1>
          <p>
            {store.profile.name === "Coder"
              ? "Your next breakthrough starts with one problem."
              : `Hey ${store.profile.name}, your next breakthrough starts with one problem.`}
          </p>
        </div>
        <span className="daily-day row hide-mobile">
          <CalendarDays size={13} />
          {date}
        </span>
      </div>
      {store.archive ? (
        <p className="screen-note">
          Your earlier work is safely filed in the{" "}
          <Link className="text-link" href="/settings/#archive">
            Legacy Archive
          </Link>
          . This desk tracks the new Iwons Path.
        </p>
      ) : null}
      <div className="stat-grid">
        {[
          {
            label: "Problems solved",
            value: stats.solved.size,
            suffix: `/ ${problems.length + store.customProblems.length}`,
            caption: "Every solve is a step forward",
            icon: CheckCheck,
            accent: stats.solved.size > 0,
          },
          {
            label: "Current streak",
            value: stats.streak,
            suffix: stats.streak === 1 ? "day" : "days",
            caption: "Make a little room for practice",
            icon: Flame,
            accent: stats.streak > 0,
          },
          {
            label: "Clean solve rate",
            value: stats.cleanRate,
            suffix: "%",
            caption: "No hints. No help. All you.",
            icon: ShieldCheck,
            accent: stats.cleanRate > 0,
          },
          {
            label: "Total experience",
            value: stats.xp,
            suffix: "XP",
            caption: `Level ${stats.level} · ${500 - (stats.xp % 500)} XP to next level`,
            icon: Zap,
            accent: false,
          },
        ].map((s) => (
          <div className="card stat-card" key={s.label}>
            <div className="stat-label">
              {s.label}
              <s.icon
                size={15}
                strokeWidth={2.5}
                className={s.accent ? "accent" : "muted"}
              />
            </div>
            <div className="stat-value">
              {s.value}
              <span>{s.suffix}</span>
            </div>
            <div className="stat-caption">{s.caption}</div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="card practice-card">
          <div>
            <div className="eyebrow row">
              <Terminal size={13} />
              {last ? "PICK UP WHERE YOU LEFT OFF" : "YOUR NEXT CHAPTER"}
            </div>
            <h2>
              {last ? (
                last.title
              ) : (
                <>
                  One good idea.
                  <br />A little more ink.
                </>
              )}
            </h2>
            <p>
              {last
                ? "Your draft is right where you left it. Take another look, find the pattern, make it click."
                : "Build the habit, learn the patterns, and turn “I think I get it” into “I solved it.”"}
            </p>
            <span className="code-watermark" aria-hidden="true">
              <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
                <path
                  d="M38 8H28Q18 8 18 18v16q0 11-12 11 12 0 12 11v16q0 10 10 10h10M72 8h10q10 0 10 10v16q0 11 12 11-12 0-12 11v16q0 10-10 10H72"
                  stroke="currentColor"
                  strokeWidth="7"
                />
              </svg>
            </span>
          </div>
          <div>
            <Link
              href={last ? problemUrl(last) : problemUrl(problems[0])}
              className="btn"
            >
              {last ? "Continue solving" : "Start Level 0"}
              <ArrowRight size={14} />
            </Link>
            <div className="practice-meta">
              <span>{problems.length} original challenges</span>
              <span>4 languages</span>
              <span>100% your pace</span>
            </div>
          </div>
        </section>
        <section className="card daily-card">
          <div>
            <div className="between">
              <span className="eyebrow">THE DAILY CHALLENGE</span>
              <Sun size={16} className="accent" />
            </div>
            <h3>{daily.title}</h3>
            <p>
              A fresh perspective. A new pattern.
              <br />
              One good problem for today.
            </p>
          </div>
          <div className="between">
            <div className="row">
              <Badge kind={daily.difficulty}>
                {daily.difficulty.charAt(0).toUpperCase() +
                  daily.difficulty.slice(1)}
              </Badge>
              <span className="chip">{daily.topics[0]}</span>
            </div>
            <Link
              href={problemUrl(daily)}
              className="icon-button"
              aria-label={`Solve ${daily.title}`}
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section className="card heatmap-card">
          <div className="card-heading">
            <h2>
              <ChartNoAxesCombined size={15} className="muted" />
              Consistency over intensity
            </h2>
            <span className="activity-meta">Last 12 months</span>
          </div>
          <Heatmap />
        </section>
        <section className="card">
          <div className="card-heading">
            <h2>
              <RotateCcw size={15} className="muted" />A little refresh
            </h2>
            <Link href="/review/" className="text-link">
              Review queue <ArrowUpRight size={12} />
            </Link>
          </div>
          {due.length ? (
            due.slice(0, 3).map((r, i) => {
              const p = [...problems, ...store.customProblems].find(
                (p) => p.id === r.problemId,
              );
              return p ? (
                <Link href="/review/" className="review-mini" key={r.problemId}>
                  <span className="num">0{i + 1}</span>
                  <div>
                    <strong>{p.title}</strong>
                    <small>{p.patterns[0]}</small>
                  </div>
                  <Badge kind={p.difficulty}>{p.difficulty}</Badge>
                </Link>
              ) : null;
            })
          ) : (
            <Empty
              title="Let your first solve sink in."
              description="Solved problems come back at just the right time. Your memory will thank you."
              icon={<BookOpen size={19} />}
            />
          )}
        </section>
        <section className="card">
          <div className="card-heading">
            <h2>
              <Terminal size={15} className="muted" />
              Recent submissions
            </h2>
            <Link className="text-link" href="/submissions/">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {store.submissions.length ? (
            store.submissions.slice(0, 4).map((s) => {
              const p = [...problems, ...store.customProblems].find(
                (p) => p.id === s.problemId,
              );
              return (
                <Link
                  href={`/submissions/detail/?id=${s.id}`}
                  className="review-mini"
                  key={s.id}
                >
                  <span
                    className={s.verdict === "accepted" ? "success" : "danger"}
                  >
                    <CheckCheck size={16} />
                  </span>
                  <div>
                    <strong>{p?.title ?? "Custom problem"}</strong>
                    <small>
                      {s.language} · {new Date(s.at).toLocaleDateString()}
                    </small>
                  </div>
                  <Badge kind={s.verdict === "accepted" ? "clean" : "flagged"}>
                    {verdictNames[s.verdict]}
                  </Badge>
                </Link>
              );
            })
          ) : (
            <Empty
              title={
                "A blank page is a good beginning."
              }
              description="Your runs become a story of progress. Submit a solution to start yours."
              action={
                <Link href="/problems/" className="text-link accent">
                  Find your first problem <ArrowRight size={12} />
                </Link>
              }
              icon={<Code2 size={20} />}
            />
          )}
        </section>
        <section className="card">
          <div className="card-heading">
            <h2>
              <LayersIcon />
              Your pattern toolkit
            </h2>
            <Link className="text-link" href="/progress/">
              Explore <ArrowUpRight size={12} />
            </Link>
          </div>
          {topics.slice(0, 4).map((topic) => {
            const all = problems.filter((p) => p.topics.includes(topic)),
              solved = all.filter((p) => stats.solved.has(p.id)).length;
            return (
              <div className="topic-row" key={topic}>
                <div className="between">
                  <span>{topic}</span>
                  <span className="mono muted">
                    {solved} / {all.length}
                  </span>
                </div>
                <ProgressBar
                  value={(solved / all.length) * 100}
                  label={`${topic} progress`}
                />
              </div>
            );
          })}
        </section>
      </div>
      {!store.profile.onboarded ? (
        <div className="onboarding-banner">
          <div className="row">
            <span className="avatar">
              <ShieldCheck size={17} className="accent" />
            </span>
            <div>
              <strong>A practice space that’s yours.</strong>
              <p>
                Pick your language and get to know Iwons Watch. Takes a minute.
              </p>
            </div>
          </div>
          <button
            className="btn secondary small"
            onClick={() => setOnboard(true)}
          >
            Make it yours <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <div className="onboarding-banner">
          <div className="row">
            <ShieldCheck size={16} className="success" />
            <div>
              <strong>Type it. Test it. Own it.</strong>
              <p>
                Your practice stays on your device. Every honest attempt counts.
              </p>
            </div>
          </div>
          <Link href="/about/" className="text-link">
            Meet Iwons <ArrowUpRight size={12} />
          </Link>
        </div>
      )}
      <Onboarding open={onboard} onClose={() => setOnboard(false)} />
    </div>
  );
}
function LayersIcon() {
  return <Code2 size={15} className="muted" />;
}
