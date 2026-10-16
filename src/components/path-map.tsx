"use client";
import Link from "next/link";
import { ArrowRight, Lock, Check, Map as MapIcon } from "lucide-react";
import type { PathLevel } from "@/lib/types";
import { useStore } from "@/store/use-store";
import { isLevelUnlocked, levelProgress } from "@/lib/path";
import { ProgressBar, useToast } from "./ui";
export function PathMap({ levels }: { levels: Omit<PathLevel, "primer" | "example">[] }) {
  const store = useStore(),
    toast = useToast();
  return (
    <>
      <div className="path-intro">
        <div className="page-heading">
          <div>
            <div className="eyebrow">A SMALL ADVENTURE IN BIG IDEAS.</div>
            <h1>
              The Iwons Path<span className="accent">.</span>
            </h1>
            <p>
              Nine chapters. One very curious typist.
              <br />
              Start small, find the patterns, and follow the ink.
            </p>
          </div>
        </div>
        <aside className="path-legend" aria-label="Path guide">
          <strong className="row">
            <MapIcon size={15} />
            Your map, your pace.
          </strong>
          <p>
            Solve 70% of a chapter to open the next. All nine chapters are ready, with 500 original problems.
          </p>
          <label className="path-toggle" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={store.settings.freeBrowse}
              onChange={(e) => {
                store.updateSettings({ freeBrowse: e.target.checked });
                toast(
                  e.target.checked
                    ? "Free browsing is on. Follow your curiosity."
                    : "The guided Path is back on.",
                );
              }}
            />
            Free browse all chapters
          </label>
        </aside>
      </div>
      <div className="path-map">
        {levels.map((level) => {
          const progress = levelProgress(level.id, store.progress),
            unlocked = isLevelUnlocked(
              level.id,
              store.progress,
              store.settings.freeBrowse,
            );
          return (
            <article
              className={`path-station ${!unlocked ? "locked" : ""} ${!level.released ? "planned" : ""}`}
              key={level.id}
            >
              <Link className="chapter-card" href={`/path/${level.id}/`}>
                <div
                  className="between"
                  style={{ border: 0, padding: 0, margin: 0 }}
                >
                  <span className="level-key">0{level.id}</span>
                  <span
                    className={`path-status ${!level.released ? "muted" : unlocked ? "success" : "warning"}`}
                  >
                    {!level.released ? (
                      "In the works"
                    ) : progress.solved === progress.total ? (
                      "Stamped!"
                    ) : unlocked ? (
                      "Open for typing"
                    ) : (
                      <span className="row" style={{ gap: 4 }}>
                        <Lock size={10} />
                        Locked
                      </span>
                    )}
                  </span>
                </div>
                <h2>{level.name}</h2>
                <p>
                  {level.subtitle}
                  <br />
                  {level.concepts.join(" / ")}
                </p>
                {level.released ? (
                  <>
                    <div className="path-progress">
                      {progress.solved} / {progress.total} solved
                    </div>
                    <ProgressBar
                      value={
                        progress.total
                          ? (progress.solved / progress.total) * 100
                          : 0
                      }
                      label={`${level.name} progress`}
                    />
                  </>
                ) : (
                  <div className="path-progress">
                    {level.count} challenges planned
                  </div>
                )}
                <div className="between">
                  <span className="eyebrow">
                    {level.tier} · LEVEL {level.id}
                  </span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      <div className="screen-note">
        No rush, no leaderboard. A chapter stamp celebrates every completed set.
        Your work stays on this device.
      </div>
    </>
  );
}
export function LevelAccess({ level }: { level: PathLevel }) {
  const store = useStore();
  const unlocked = isLevelUnlocked(
    level.id,
    store.progress,
    store.settings.freeBrowse,
  );
  const p = levelProgress(Math.max(0, level.id - 1), store.progress);
  if (!level.released)
    return (
      <div className="archive-note">
        <strong>Still on the drafting table.</strong>
        <p>
          This chapter is mapped, with {level.count} original challenges
          planned. Start with one of the three released chapters while we let
          the ink dry.
        </p>
        <Link href="/path/" className="text-link">
          Back to the Path →
        </Link>
      </div>
    );
  if (!store.hydrated)
    return (
      <div className="skeleton" style={{ height: 60, marginBottom: 24 }} />
    );
  if (unlocked)
    return (
      <div className="screen-note row" style={{ marginBottom: 24, minHeight:60 }}>
        <Check size={15} />
        {store.settings.freeBrowse
          ? "Free browse is on."
          : `Chapter ${level.id + 1} is open.`}{" "}
        Type when you’re ready.
      </div>
    );
  return (
    <div className="archive-note">
      <strong className="row">
        <Lock size={15} />A little more practice first.
      </strong>
      <p>
        Solve {p.threshold} of {p.total} exercises in Level {level.id - 1} to
        unlock this chapter ({p.solved} done). Or turn on free browse in
        Settings.
      </p>
      <Link href={`/path/${level.id - 1}/`} className="text-link">
        Back one chapter →
      </Link>
    </div>
  );
}
