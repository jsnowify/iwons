"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics" | "patterns" | "overview" | "complexity">;
import { useState } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight, BookOpen, CheckCheck } from "lucide-react";
import { useStore } from "@/store/use-store";
import { problemUrl } from "@/lib/presentation";
import { rateReview, intervals, type Rating } from "@/lib/srs";
import { Button, Empty, Badge, useToast } from "./ui";
import { Inline } from "./inline-code";
export function ReviewPage({problems}:{problems:CatalogEntry[]}) {
  const store = useStore(),
    toast = useToast();
  const [shown, setShown] = useState(false);
  const due = store.srs
    .filter((r) => r.due <= Date.now())
    .toSorted((a, b) => a.due - b.due);
  const r = due[0],
    p = r
      ? [...problems, ...store.customProblems].find((p) => p.id === r.problemId)
      : null;
  const future = store.srs
    .filter((r) => r.due > Date.now())
    .toSorted((a, b) => a.due - b.due);
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT STICK.</div>
          <h1>
            Remember the pattern<span className="accent">.</span>
          </h1>
          <p>Recall first. Review second. A little spacing goes a long way.</p>
        </div>
        <Badge>{due.length} due today</Badge>
      </div>
      {p && r ? (
        <div className="card review-card">
          <div className="eyebrow accent">
            {due.length} IN YOUR QUEUE · STEP {r.step + 1} OF 5
          </div>
          <h2>{p.title}</h2>
          <div
            className="row"
            style={{ justifyContent: "center", marginBottom: 24 }}
          >
            <Badge kind={p.difficulty}>{p.difficulty}</Badge>
            <span className="chip">{p.topics[0]}</span>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            Without looking at your old code: what was the key idea? What should
            you watch out for?
          </p>
          {shown ? (
            <div className="stack" style={{ marginTop: 24, textAlign: "left" }}>
              <div className="screen-note">
                <strong>{p.patterns.join(", ")}</strong>
                <p><Inline text={p.overview} /></p>
                <p>
                  Time {p.complexity.time} · Space {p.complexity.space}
                </p>
              </div>
              {store.notes[p.id] ? (
                <pre className="prose-code">{store.notes[p.id]}</pre>
              ) : null}
              <Link href={problemUrl(p)} className="text-link accent">
                Solve it again <ArrowRight size={12} />
              </Link>
              <div className="rating-grid">
                {(["Again", "Hard", "Good", "Easy"] as Rating[]).map(
                  (rating) => (
                    <Button
                      variant={rating === "Good" ? "" : "secondary"}
                      key={rating}
                      onClick={() => {
                        const next = rateReview(r, rating);
                        store.setReviews(
                          store.srs.map((v) =>
                            v.problemId === r.problemId ? next : v,
                          ),
                        );
                        setShown(false);
                        toast(
                          `Next review in ${intervals[next.step]} day${intervals[next.step] === 1 ? "" : "s"}.`,
                        );
                      }}
                    >
                      {rating}
                      <small>{intervals[rateReview(r, rating).step]}d</small>
                    </Button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <Button style={{ marginTop: 32 }} onClick={() => setShown(true)}>
              <BookOpen size={14} />
              Show approach
            </Button>
          )}
        </div>
      ) : (
        <div className="card">
          <Empty
            title="All clear for now."
            description={
              future.length
                ? `Your next review is ${new Date(future[0].due).toLocaleDateString()}. Give your memory a little breathing room.`
                : "Accepted problems join your queue automatically. Your first review arrives a day after your first solve."
            }
            icon={<CheckCheck size={24} />}
            action={
              <Link href="/problems/" className="btn">
                Find a new challenge <ArrowRight size={14} />
              </Link>
            }
          />
        </div>
      )}
      <div className="screen-note row" style={{ marginTop: 24 }}>
        <RotateCcw size={15} />
        <span>
          Review intervals: 1 → 3 → 7 → 14 → 30 days. Again restarts at one day;
          Easy skips ahead.
        </span>
      </div>
    </div>
  );
}
