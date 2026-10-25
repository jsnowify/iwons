"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/store/use-store";
import { levels } from "@/lib/levels";
import { levelProgress } from "@/lib/path";
import { levelEmblems } from "@/lib/level-emblems";
import type { Difficulty } from "@/lib/types";

const tierColor: Record<Difficulty, string> = {
  easy: "var(--accent-3)",
  medium: "var(--accent-2)",
  hard: "var(--accent)",
};
const HEX = "50,4 93,27 93,73 50,96 7,73 7,27";
const INNER = "50,12 86,32 86,68 50,88 14,68 14,32";
const RING = 2 * Math.PI * 46;

/** One medal per Path level, earned once every problem in that level is solved. */
export function LevelBadges() {
  const progress = useStore((s) => s.progress);
  const hydrated = useStore((s) => s.hydrated);
  const rows = useMemo(
    () =>
      levels
        .filter((l) => l.released)
        .map((level) => ({ level, ...levelProgress(level.id, progress) })),
    [progress],
  );
  const earned = rows.filter((r) => r.total && r.solved === r.total).length;
  if (!hydrated)
    return <div className="skeleton" style={{ height: 200 }} role="status" aria-label="Loading badges" />;
  return (
    <section className="card level-badges" aria-labelledby="level-badges-heading">
      <div className="card-heading">
        <h2 id="level-badges-heading">Level badges</h2>
        <span className="muted">
          {earned}/{rows.length} earned
        </span>
      </div>
      <ul className="badge-grid">
        {rows.map(({ level, solved, total }) => {
          const done = total > 0 && solved === total;
          return (
            <li key={level.id}>
              <Link
                href={`/path/${level.id}/`}
                className={`level-badge${done ? " earned" : ""}`}
                style={{ "--badge": tierColor[level.tier] } as React.CSSProperties}
                aria-label={`Level ${level.id}, ${level.name}: ${done ? "badge earned" : `${solved} of ${total} solved`}`}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <polygon className="badge-hex" points={HEX} />
                  <polygon className="badge-inner" points={INNER} />
                  {!done ? (
                    <circle
                      className="badge-ring"
                      cx="50"
                      cy="50"
                      r="46"
                      strokeDasharray={RING}
                      strokeDashoffset={RING * (1 - (total ? solved / total : 0))}
                      transform="rotate(-90 50 50)"
                    />
                  ) : null}
                  <g
                    className="badge-emblem"
                    transform="translate(30 30) scale(0.83)"
                    dangerouslySetInnerHTML={{ __html: levelEmblems[level.id] ?? levelEmblems[0] }}
                  />
                  {!done ? (
                    <g className="badge-lock" transform="translate(76 76)">
                      <circle r="10" />
                      <rect x="-4.5" y="-1" width="9" height="7" rx="1.5" />
                      <path d="M-2.8-1v-2.2a2.8 2.8 0 0 1 5.6 0V-1" />
                    </g>
                  ) : null}
                </svg>
                <strong>{level.name}</strong>
                <small className="muted">
                  Level {level.id} · {done ? "Complete" : `${solved}/${total}`}
                </small>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
