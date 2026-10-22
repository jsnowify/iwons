"use client";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/store/use-store";
import type { FoundationTopic } from "@/lib/topic-foundations";
import { isLevelUnlocked } from "@/lib/path";
import { FoundationLesson } from "./foundation-lesson";
import { Button } from "./ui";

export function TopicFoundation({ id, level, children }: { id: string; level: number; children: ReactNode }) {
  const store = useStore();
  const [topic, setTopic] = useState<FoundationTopic | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || topic) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/foundation-data/${id}.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(value => { if (!controller.signal.aborted) { setLoading(false); setTopic(value); } })
      .catch(() => { if (!controller.signal.aborted) { setLoading(false); setError("The lesson could not load. Please try again."); setOpen(false); } });
    return () => controller.abort();
  }, [open, id, topic]);
  const unlocked = !!store.topicFoundations[id]?.completed;
  const chapterOpen = store.hydrated && isLevelUnlocked(level, store.progress, store.settings.freeBrowse);
  return <>
    {topic ? <FoundationLesson topic={topic} /> : <div className="screen-note">
      <p>Foundation Lesson · Learn with a worked example, then try one small change.</p>
      <Button disabled={!chapterOpen} loading={loading} onClick={() => { setError(""); setOpen(true); }}>Start or resume foundation</Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>}
    <h3>{unlocked ? "Topic challenges" : "Coming next: topic challenges"}</h3>
    {!unlocked ? <p>Complete this topic’s foundation to unlock these challenges.</p> : null}
    <TopicChallengeContext.Provider value={chapterOpen && unlocked}>{children}</TopicChallengeContext.Provider>
  </>;
}

const TopicChallengeContext = createContext(false);
export function TopicChallenge({ slug, children }: { slug: string; children: ReactNode }) {
  const unlocked = useContext(TopicChallengeContext);
  return unlocked ? <Link className="level-problem-link" href={`/problems/${slug}/`}>{children}</Link>
    : <div className="level-problem-link" aria-disabled="true">{children}</div>;
}

export function TopicChallengeStatus() {
  return useContext(TopicChallengeContext) ? <ArrowRight size={17} aria-label="Open challenge" /> : <Lock size={17} aria-label="Locked challenge" />;
}
