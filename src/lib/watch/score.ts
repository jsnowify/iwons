import type { IntegrityEvent, IntegritySummary } from "@/lib/types";
export function summarize(
  events: IntegrityEvent[],
  contest = false,
  browser = "Unknown",
): IntegritySummary {
  const away = events.filter(
    (e) =>
      e.type === "tab_visible" ||
      (e.type === "window_focus" && e.meta?.away === true),
  );
  const totalAwayMs = away.reduce((n, e) => n + (e.durationMs ?? 0), 0);
  const pastes = events.filter((e) => e.type === "paste");
  const exits = events.filter((e) => e.type === "fullscreen_exit").length;
  const large = pastes.filter(
    (e) => Number(e.meta?.chars) > 200 || Number(e.meta?.lines) > 8,
  ).length;
  const score = Math.max(
    0,
    100 -
      Math.min(30, away.filter((e) => (e.durationMs ?? 0) > 5000).length * 3) -
      Math.min(20, Math.floor(totalAwayMs / 30000)) -
      Math.min(30, large * 15) -
      Math.min(20, contest ? exits * 10 : 0) -
      Math.min(20, events.filter((e) => e.type === "typing_burst").length * 10),
  );
  return {
    score,
    tabSwitches: events.filter((e) => e.type === "tab_hidden").length,
    totalAwayMs,
    pastes: pastes.length,
    largestPasteChars: Math.max(
      0,
      ...pastes.map((e) => Number(e.meta?.chars) || 0),
    ),
    fullscreenExits: exits,
    browser,
    events,
  };
}
