"use client";
import { useState } from "react";
import { LearningProgress } from "./learning-progress";
import Link from "next/link";
import {
  Download,
  Trophy,
  Flame,
  ShieldCheck,
  Zap,
  CheckCheck,
  ArrowUpRight,
  Languages,
} from "lucide-react";
import { useStore } from "@/store/use-store";
import { getStats } from "@/lib/stats";
import { levelProgress } from "@/lib/path";
import { levels } from "@/lib/levels";
import { problems, topics, languageNames, topicSlug } from "@/lib/catalog";
import { Heatmap } from "./heatmap";
import { Button, ProgressBar, useToast } from "./ui";
export function ProgressPage() {
  const [patternsExpanded, setPatternsExpanded] = useState(false);
  const store = useStore(),
    toast = useToast();
  const stats = getStats(store.submissions);
  const all = [...problems, ...store.customProblems];
  const badges = [
    {
      name: "First solve",
      description: "One problem. One good beginning.",
      earned: stats.solved.size >= 1,
      icon: CheckCheck,
    },
    {
      name: "Seven in a row",
      description: "A seven-day practice streak.",
      earned: stats.streak >= 7,
      icon: Flame,
    },
    {
      name: "Clean ten",
      description: "Ten solves without help or Watch penalties.",
      earned: stats.clean >= 10,
      icon: ShieldCheck,
    },
    {
      name: "Polyglot",
      description: "Solve one problem in all four languages.",
      earned: all.some(
        (p) =>
          new Set(
            stats.accepted
              .filter((s) => s.problemId === p.id)
              .map((s) => s.language),
          ).size === 4,
      ),
      icon: Languages,
    },
  ];
  async function flex() {
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d")!;
      const css = getComputedStyle(document.documentElement),
        body = getComputedStyle(document.body);
      const color = (v: string) => css.getPropertyValue(v).trim();
      ctx.fillStyle = color("--bg");
      ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = color("--surface");
      ctx.fillRect(32, 32, 1136, 566);
      ctx.strokeStyle = color("--border");
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 32, 1136, 566);
      ctx.fillStyle = color("--accent");
      ctx.fillRect(64, 64, 52, 52);
      ctx.fillStyle = color("--on-accent");
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("I", 83, 103);
      ctx.fillStyle = color("--text");
      ctx.font = `900 40px ${body.getPropertyValue("--font-display")}`;
      ctx.fillText("Iwons.", 132, 104);
      ctx.fillStyle = color("--muted");
      ctx.font = `18px ${body.fontFamily}`;
      ctx.fillText("TYPE IT. TEST IT. OWN IT.", 64, 166);
      ctx.fillStyle = color("--text");
      ctx.font = `700 52px ${body.getPropertyValue("--font-display")}`;
      ctx.fillText(store.profile.name.slice(0, 24), 64, 252);
      ctx.font = `18px ${body.fontFamily}`;
      ctx.fillStyle = color("--muted");
      ctx.fillText(
        `Level ${stats.level} · ${stats.xp} XP · Practice stays on my device`,
        64,
        296,
      );
      const fields = [
        [String(stats.solved.size), "PROBLEMS SOLVED"],
        [`${stats.streak} days`, "CURRENT STREAK"],
        [`${stats.cleanRate}%`, "CLEAN SOLVE RATE"],
      ];
      fields.forEach(([v, l], i) => {
        ctx.fillStyle = color("--accent");
        ctx.font = `bold 52px ${body.fontFamily}`;
        ctx.fillText(v, 64 + i * 370, 422);
        ctx.fillStyle = color("--muted");
        ctx.font = `14px ${body.fontFamily}`;
        ctx.fillText(l, 64 + i * 370, 460);
      });
      ctx.strokeStyle = color("--border");
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(64, 506);
      ctx.lineTo(1136, 506);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(1004, 125);
      ctx.rotate(-0.08);
      ctx.strokeStyle = color("--accent-text");
      ctx.fillStyle = color("--accent-text");
      ctx.lineWidth = 3;
      ctx.strokeRect(-120, -32, 240, 66);
      ctx.font = `20px ${body.getPropertyValue("--font-stamp")}`;
      ctx.textAlign = "center";
      ctx.fillText("HONEST PRACTICE", 0, -3);
      ctx.font = `12px ${body.fontFamily}`;
      ctx.fillText("ONE KEY AT A TIME", 0, 18);
      ctx.restore();
      ctx.fillStyle = color("--muted");
      ctx.font = `16px ${body.fontFamily}`;
      ctx.fillText("Iwons Watch · Honor-system stats, stored locally", 64, 552);
      ctx.textAlign = "right";
      ctx.fillText(new Date().toLocaleDateString(), 1136, 552);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "Iwons-flex-card.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      toast("Your Flex Card is ready.");
    } catch {
      toast("Could not create the card. Please try again.");
    }
  }
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE WORK IS ADDING UP.</div>
          <h1>
            Look how far you’ve come<span className="accent">.</span>
          </h1>
          <p>Real attempts. Real learning. All yours.</p>
        </div>
        <Button variant="secondary" onClick={() => void flex()}>
          <Download size={14} />
          Flex Card
        </Button>
      </div>
      <section className="card" style={{ marginBottom: 28, padding: 24 }}>
        <div className="card-heading">
          <h2>Chapter stamps</h2>
          <Link className="text-link" href="/path/">
            The Path
          </Link>
        </div>
        <div className="option-row">
          {levels
            .filter((l) => l.released)
            .map((level) => {
              const p = levelProgress(level.id, store.progress);
              return (
                <Link
                  href={`/path/${level.id}/`}
                  key={level.id}
                  className={`stamp ${p.solved === p.total ? "success" : "muted"}`}
                >
                  Level {level.id} · {p.solved}/{p.total}
                  <br />
                  {p.solved === p.total ? "COMPLETE" : level.name}
                </Link>
              );
            })}
        </div>
      </section>
      <div className="stat-grid">
        {[
          ["Solved", stats.solved.size],
          ["Day streak", stats.streak],
          ["Clean solve rate", `${stats.cleanRate}%`],
          ["Clean streak", stats.cleanStreak],
        ].map(([l, v]) => (
          <div className="card stat-card" key={l}>
            <span className="stat-label">{l}</span>
            <div className="stat-value">{v}</div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <LearningProgress />
        <section className="card fullspan">
          <div className="card-heading">
            <h2>Practice, one square at a time</h2>
            <span className="muted" style={{ fontSize: 11 }}>
              Your activity
            </span>
          </div>
          <Heatmap />
        </section>
        <section className="card" aria-labelledby="pattern-strength-heading" style={{ alignSelf: "start" }}>
          <div className="card-heading">
            <h2 id="pattern-strength-heading">Pattern strength</h2>
            {topics.length > 5 && (
              <Button
                type="button"
                aria-expanded={patternsExpanded}
                aria-controls="pattern-strength-list"
                onClick={() => setPatternsExpanded(!patternsExpanded)}
              >
                {patternsExpanded ? "Collapse" : "Expand"}
              </Button>
            )}
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            {patternsExpanded ? topics.length : Math.min(5, topics.length)} of {topics.length} patterns
          </p>
          <div id="pattern-strength-list">
          {(patternsExpanded ? topics : topics.slice(0, 5)).map((t) => {
            const list = problems.filter((p) => p.topics.includes(t)),
              count = list.filter((p) => stats.solved.has(p.id)).length;
            return (
              <div className="topic-row" key={t}>
                <div className="between">
                  <Link href={`/topics/${topicSlug(t)}/`} className="text-link">
                    {t} <ArrowUpRight size={11} />
                  </Link>
                  <span className="mono muted" style={{ fontSize: 11 }}>
                    {count}/{list.length}
                  </span>
                </div>
                <ProgressBar value={(count / list.length) * 100} label={t} />
              </div>
            );
          })}
          </div>
        </section>
        <div className="stack">
          <section className="card">
            <div className="card-heading">
              <h2>Room to grow</h2>
              <span className="eyebrow accent">LEVEL {stats.level}</span>
            </div>
            <div className="stat-value">
              {stats.xp}
              <span>XP</span>
            </div>
            <ProgressBar value={(stats.xp % 500) / 5} label="Level progress" />
            <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
              100 XP per first solve. 25 bonus XP per clean solve.
            </p>
            {(["easy", "medium", "hard"] as const).map((d) => {
              const list = problems.filter((p) => p.difficulty === d);
              return (
                <div
                  className="between"
                  style={{ fontSize: 12, marginTop: 16 }}
                  key={d}
                >
                  <span
                    className={
                      d === "easy"
                        ? "success"
                        : d === "medium"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </span>
                  <span className="mono muted">
                    {list.filter((p) => stats.solved.has(p.id)).length} /{" "}
                    {list.length}
                  </span>
                </div>
              );
            })}
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>Languages in your toolkit</h2>
            </div>
            {Object.entries(languageNames).map(([key, label]) => {
              const n = stats.accepted.filter((s) => s.language === key).length;
              return (
                <div className="topic-row" key={key}>
                  <div className="between">
                    <span>{label}</span>
                    <span className="mono muted">{n}</span>
                  </div>
                  <ProgressBar
                    value={
                      stats.accepted.length
                        ? (n / stats.accepted.length) * 100
                        : 0
                    }
                    label={label}
                  />
                </div>
              );
            })}
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>Little milestones</h2>
              <Trophy size={15} className="accent" />
            </div>
            {badges.map((b) => (
              <div
                className={`achievement ${b.earned ? "" : "locked"}`}
                key={b.name}
              >
                <span className="avatar">
                  <b.icon size={17} className={b.earned ? "accent" : "muted"} />
                </span>
                <div>
                  <strong>
                    {b.name}
                    {b.earned ? " · Earned" : ""}
                  </strong>
                  <small>{b.description}</small>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
