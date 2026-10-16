"use client";
import { useStore } from "@/store/use-store";
import { localDay } from "@/lib/stats";
export function Heatmap() {
  const submissions = useStore((s) => s.submissions),
    hydrated = useStore((s) => s.hydrated);
  if (!hydrated)
    return (
      <div
        className="skeleton"
        role="status"
        style={{ height: 140 }}
        aria-label="Loading activity"
      />
    );
  const counts = new Map<string, number>();
  for (const s of submissions)
    if (s.verdict === "accepted") {
      const key = localDay(s.at);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364 - start.getDay());
  const cells = Array.from({ length: 371 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = localDay(date);
    return { key, count: counts.get(key) ?? 0, future: date > today };
  });
  const active = cells.filter((c) => c.count > 0).length;
  return (
    <>
      <div className="heatmap-scroll" tabIndex={0} role="region" aria-label="Activity calendar, scroll to explore">
        <div className="heat-months">
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date(
              today.getFullYear(),
              today.getMonth() - 11 + i,
              1,
            );
            return (
              <span key={i}>
                {date.toLocaleDateString("en", { month: "short" })}
              </span>
            );
          })}
        </div>
        <div
          className="heatmap"
          role="img"
          aria-label={`${active} active practice days in the past year`}
        >
          {cells.map((cell) => (
            <div
              key={cell.key}
              className={`heat-cell ${cell.count ? `l${Math.min(4, cell.count)}` : ""}`}
              style={cell.future ? { visibility: "hidden" } : undefined}
              title={`${cell.key}: ${cell.count} accepted submission${cell.count === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </div>
      <div className="heat-footer">
        <span>
          <strong>{active}</strong> active days in the last year
        </span>
        <span className="heat-legend">
          Less{" "}
          {[0, 1, 2, 3, 4].map((n) => (
            <i key={n} className={`heat-cell ${n ? `l${n}` : ""}`} />
          ))}{" "}
          More
        </span>
      </div>
    </>
  );
}
