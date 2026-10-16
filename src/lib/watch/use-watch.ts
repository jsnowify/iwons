"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { IntegrityEvent } from "@/lib/types";
import { probePresence } from "./presence";
import { summarize } from "./score";
export function useWatch(contest: boolean, enabled: boolean) {
  const events = useRef<IntegrityEvent[]>([]);
  const [, render] = useState(0);
  const [away, setAway] = useState<IntegrityEvent | null>(null);
  const log = useCallback(
    (type: IntegrityEvent["type"], meta?: Record<string, unknown>) => {
      if (!enabled) return;
      events.current.push({ t: Date.now(), type, meta });
      render((n) => n + 1);
    },
    [enabled],
  );
  useEffect(() => {
    if (!enabled) return;
    let awayAt = 0,
      hidden = false;
    const push = (e: IntegrityEvent) => {
      events.current.push(e);
      render((n) => n + 1);
    };
    const leave = (type: "tab_hidden" | "window_blur") => {
      if (!awayAt) awayAt = Date.now();
      if (type === "tab_hidden") hidden = true;
      push({ t: Date.now(), type });
    };
    const back = () => {
      if (document.hidden || !document.hasFocus() || !awayAt) return;
      const e: IntegrityEvent = {
        t: Date.now(),
        type: hidden ? "tab_visible" : "window_focus",
        durationMs: Date.now() - awayAt,
        meta: { away: !hidden },
      };
      push(e);
      awayAt = 0;
      hidden = false;
      if ((e.durationMs ?? 0) > 10000) setAway(e);
    };
    const visibility = () => (document.hidden ? leave("tab_hidden") : back());
    const blur = () => leave("window_blur");
    const focus = () => back();
    const full = () => {
      if (!document.fullscreenElement && contest)
        push({ t: Date.now(), type: "fullscreen_exit" });
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("fullscreenchange", full);
    const multi = () => log("multi_tab");
    window.addEventListener("iwons:multi-tab", multi);
    probePresence();
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("fullscreenchange", full);
      window.removeEventListener("iwons:multi-tab", multi);
    };
  }, [contest, enabled, log]);
  function report(value?: IntegrityEvent["selfReport"]) {
    if (away && value) away.selfReport = value;
    setAway(null);
  }
  function reset() {
    events.current = [];
    render((n) => n + 1);
  }
  const getSummary = () =>
    summarize(
      events.current,
      contest,
      typeof navigator === "undefined" ? "Unknown" : navigator.userAgent,
    );
  return {
    getSummary,
    summary: summarize(
      events.current,
      contest,
      typeof navigator === "undefined" ? "Unknown" : navigator.userAgent,
    ),
    log,
    away,
    report,
    reset,
  };
}
