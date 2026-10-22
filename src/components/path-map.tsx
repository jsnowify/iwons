"use client";
import Link from "next/link";
import { ArrowRight, Check, Map as MapIcon } from "lucide-react";
import type { PathLevel } from "@/lib/types";
import { useStore } from "@/store/use-store";
import { levelProgress } from "@/lib/path";
import { ProgressBar } from "./ui";
export function PathMap({ levels }: { levels: Omit<PathLevel, "primer" | "example">[] }) {
  const store = useStore();
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
            All nine chapters and 500 challenges are open. Start anywhere and learn at your own pace.
          </p>
        </aside>
      </div>
      <div className="path-map">
        {levels.map((level) => {
          const progress = levelProgress(level.id, store.progress);
          return (
            <article
              className={`path-station ${!level.released ? "planned" : ""}`}
              key={level.id}
            >
              <Link className="chapter-card" href={`/path/${level.id}/`}>
                <div
                  className="between"
                  style={{ border: 0, padding: 0, margin: 0 }}
                >
                  <span className="level-key">0{level.id}</span>
                  <span
                    className={`path-status ${!level.released ? "muted" : "success"}`}
                  >
                    {!level.released ? (
                      "In the works"
                    ) : progress.solved === progress.total ? (
                      "Stamped!"
                    ) : (
                      "Open for typing"
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
    </>
  );
}
export function LevelAccess({ level }: { level: PathLevel }) {
  return <div className="screen-note row" style={{ marginBottom: 24, minHeight: 60 }}>
    <Check size={15} />Chapter {level.id + 1} is open. Type when you&apos;re ready.
  </div>;
}
