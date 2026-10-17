"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics" | "patterns">;
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  Zap,
} from "lucide-react";
import { problemUrl } from "@/lib/presentation";
import { useStore } from "@/store/use-store";
import { isLevelUnlocked } from "@/lib/path";
import { Button, ProgressBar, Badge, useToast } from "./ui";
const plans = [
  {
    id: "foundations",
    name: "A stronger foundation",
    days: 30,
    description:
      "From your first loop to your first frequency map. A steady tour through the foundations of the 500-problem Path.",
    icon: Compass,
  },
  {
    id: "patterns",
    name: "The pattern refresher",
    days: 14,
    description:
      "Two weeks of focused recall. Revisit the ideas that show up everywhere, one small set at a time.",
    icon: Zap,
  },
];
export function PlansPage({problems}:{problems:CatalogEntry[]}) {
  const store = useStore(),
    toast = useToast();
  const [active, setActive] = useState(""),
    [day, setDay] = useState(0);
  const plan = plans.find((p) => p.id === active);
  const pool = plan?.id === "foundations" ? problems.filter(p => p.level <= 2) : problems.filter(p => isLevelUnlocked(p.level, store.progress, store.settings.freeBrowse));
  const schedule = plan
    ? Array.from({ length: plan.days }, (_, i) => {
        if (plan.id === "patterns") {
          const index = Math.floor(i * pool.length / plan.days);
          return [pool[index], pool[(index + Math.floor(pool.length / 2)) % pool.length]];
        }
        const fresh = pool.filter(
          (_, j) => Math.floor((j * plan.days) / pool.length) === i,
        );
        return fresh.length
          ? fresh
          : [pool[Math.floor((i * pool.length) / plan.days)]];
      })
    : [];
  const current = schedule[day] ?? [];
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TAKE THE GUESSWORK OUT.</div>
          <h1>
            A little structure helps<span className="accent">.</span>
          </h1>
          <p>Choose a plan. Make time for today. Repeat.</p>
        </div>
      </div>
      {!plan ? (
        <div className="section-grid">
          {plans.map((p) => (
            <section className="card list-card" key={p.id}>
              <div className="between">
                <p.icon size={24} className="accent" />
                <Badge>{p.days} days</Badge>
              </div>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="between">
                <span className="eyebrow">
                  {store.plans[p.id]
                    ? `DAY ${store.plans[p.id]}`
                    : "AT YOUR PACE"}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActive(p.id);
                    setDay(
                      Math.min(
                        p.days - 1,
                        Math.max(0, (store.plans[p.id] ?? 1) - 1),
                      ),
                    );
                  }}
                >
                  {store.plans[p.id] ? "Continue" : "Explore plan"}
                  <ArrowRight size={13} />
                </Button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <Button
            variant="ghost"
            style={{ marginBottom: 20 }}
            onClick={() => setActive("")}
          >
            <ArrowLeft size={13} />
            All plans
          </Button>
          <section className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow accent">{plan.days}-DAY PLAN</span>
                <h2 style={{ marginTop: 8, fontSize: 24 }}>{plan.name}</h2>
              </div>
              <Badge>
                Day {day + 1} of {plan.days}
              </Badge>
            </div>
            <p className="muted" style={{ fontSize: 12 }}>
              {plan.description}
            </p>
            <div className="plan-days">
              {schedule.map((set, i) => (
                <button
                  key={i}
                  className={`plan-day ${set.length && set.every((p) => store.progress[p.id]) ? "done" : ""}`}
                  style={
                    day === i
                      ? { borderColor: "var(--accent)", color: "var(--accent)" }
                      : undefined
                  }
                  onClick={() => setDay(i)}
                  aria-label={`Study day ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <h3 style={{ marginBottom: 16 }}>Today’s focus</h3>
            {current.map((p) => (
              <Link className="review-mini" href={problemUrl(p)} key={p.id}>
                <span className={store.progress[p.id] ? "success" : "muted"}>
                  {store.progress[p.id] ? (
                    <Check size={16} />
                  ) : (
                    <CalendarDays size={16} />
                  )}
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <small>{p.patterns[0]}</small>
                </div>
                <Badge kind={p.difficulty}>{p.difficulty}</Badge>
                <ArrowRight size={14} className="muted" />
              </Link>
            ))}
            <div className="between" style={{ marginTop: 24 }}>
              <Button
                variant="secondary"
                disabled={day === 0}
                onClick={() => setDay((d) => d - 1)}
              >
                <ArrowLeft size={13} />
                Previous day
              </Button>
              <Button
                onClick={() => {
                  const next = Math.min(plan.days, day + 2);
                  store.setPlan(plan.id, next);
                  setDay(Math.min(plan.days - 1, day + 1));
                  toast(
                    day === plan.days - 1
                      ? "Plan completed. Look at that consistency."
                      : "Tomorrow’s focus is ready.",
                  );
                }}
              >
                {day === plan.days - 1 ? "Complete plan" : "Next day"}
                <ArrowRight size={13} />
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
