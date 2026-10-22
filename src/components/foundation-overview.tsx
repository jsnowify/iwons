"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useStore } from "@/store/use-store";
import { foundationModules, foundationOutline, foundationTotal, FOUNDATION_TRACK_ID, lessonDone, lessonStatus, moduleProgress } from "@/lib/foundation-track";
import { useAccount } from "./account-provider";
import { ProgressBar } from "./ui";

export function FoundationOverview() {
  const progress = useStore(state => state.topicFoundations[FOUNDATION_TRACK_ID]);
  const hydrated = useStore(state => state.hydrated);
  const { ready } = useAccount();
  const loaded = hydrated && ready;
  const steps = loaded ? progress?.steps : undefined;
  const completed = foundationOutline.filter(entry => entry.contentId && lessonDone(steps, entry.contentId)).length;
  const available = foundationOutline.filter(entry => entry.contentId).length;
  return <>
    <div className="page-heading"><div>
      <h1>Foundation<span className="accent">.</span></h1>
      <p>A gentle, optional course for beginners: {foundationTotal} short lessons in five modules. Visit any lesson, in any order, whenever it helps.</p>
      <p>Every lesson is optional. <Link className="text-link" href="/problems/">Go straight to challenges</Link></p>
    </div></div>
    <p>{completed} of {foundationTotal} lessons done</p>
    <ProgressBar value={completed / foundationTotal * 100} label="Foundation progress" />
    {available < foundationTotal ? <p className="muted foundation-rollout">{available} lessons are ready now. The rest are being written and will appear here as they land.</p> : null}
    {foundationModules.map(module => {
      const stats = moduleProgress(module.id, steps);
      const lessons = foundationOutline.map((entry, index) => ({ entry, number: index + 1 })).filter(item => item.entry.moduleId === module.id);
      return <section key={module.id} className="foundation-module" aria-labelledby={`module-${module.id}`}>
        <header className="foundation-module-header">
          <div><span className="eyebrow">Module {module.order}</span><h2 id={`module-${module.id}`}>{module.title}</h2></div>
          <span className="foundation-module-count">
            {stats.complete ? <><Check size={16} aria-hidden="true" />Module complete</> : `${stats.done} of ${stats.total} done`}
          </span>
        </header>
        <ProgressBar value={stats.done / stats.total * 100} label={`${module.title} progress`} />
        <ol className="foundation-list" aria-label={`${module.title} lessons`}>
          {lessons.map(({ entry, number }) => {
            const body = <>
              <span className="level-key" aria-hidden="true">{number}</span>
              <div className="foundation-list-title"><h3>{entry.title}</h3><span className="muted">{entry.summary}</span></div>
            </>;
            const kind = entry.type === "code" ? "Code" : "Concept";
            if (!entry.contentId) return <li key={entry.id}>
              <div className="level-problem-link foundation-pending">
                {body}
                <span className="foundation-list-status"><span className="badge">{kind}</span>Coming soon</span>
              </div>
            </li>;
            const status = lessonStatus(steps?.[entry.contentId], lessonDone(steps, entry.contentId));
            return <li key={entry.id}>
              <Link href={`/foundation/${entry.contentId}/`} className="level-problem-link">
                {body}
                <span className="foundation-list-status"><span className="badge">{kind}</span>{status === "Done" ? <Check size={16} aria-hidden="true" /> : null}<span>{status}</span></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </>;
}
