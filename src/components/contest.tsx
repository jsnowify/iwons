"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Timer,
  ShieldCheck,
  Maximize2,
  Play,
  Check,
  ArrowRight,
  Flag,
} from "lucide-react";
import { problems, problemUrl } from "@/lib/catalog";
import { isLevelUnlocked } from "@/lib/path";
import { useStore } from "@/store/use-store";
import { Button, Badge, Modal, useToast } from "./ui";
import { Onboarding } from "./onboarding";
export function ContestPage() {
  const store = useStore(),
    router = useRouter(),
    toast = useToast();
  const [mode, setMode] = useState<"contest" | "mock">("contest"),
    [count, setCount] = useState(3),
    [minutes, setMinutes] = useState(60),
    [difficulty, setDifficulty] = useState(""),
    [error, setError] = useState(""),
    [onboard, setOnboard] = useState(false),
    [end, setEnd] = useState(false),
    [now, setNow] = useState(0);
  const session = store.sessions.contest;
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (session && !session.finished && now && now >= session.endsAt)
      store.setSession({ contest: { ...session, finished: true } });
  }, [now, session]);
  async function fullscreen() {
    if (!document.fullscreenElement)
      await document.documentElement.requestFullscreen();
  }
  async function start() {
    setError("");
    if (!store.profile.onboarded) {
      setOnboard(true);
      return;
    }
    try {
      await fullscreen();
      const pool = problems.filter(
        (p) =>
          (!difficulty || p.difficulty === difficulty) &&
          isLevelUnlocked(p.level, store.progress, store.settings.freeBrowse),
      );
      if (pool.length < count)
        throw new Error("Choose fewer problems for this difficulty.");
      for (let i = pool.length - 1; i > 0; i--) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        const j = values[0] % (i + 1);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const picked = pool.slice(0, count);
      const startedAt = Date.now();
      store.setSession({
        contest: {
          id: crypto.randomUUID(),
          problemIds: picked.map((p) => p.id),
          startedAt,
          endsAt: startedAt + minutes * 60000,
          mode,
          finished: false,
        },
      });
      router.push(problemUrl(picked[0]));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Fullscreen is unavailable. Try a supported desktop browser.",
      );
    }
  }
  const used = store.submissions.filter(
    (s) =>
      s.mode === "contest" &&
      session &&
      s.at >= session.startedAt &&
      session.problemIds.includes(s.problemId),
  );
  const solved = new Set(
    used.filter((s) => s.verdict === "accepted").map((s) => s.problemId),
  );
  const exits = used.reduce(
    (n, s) => Math.max(n, s.integrity.fullscreenExits),
    0,
  );
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE PRESSURE. A LOT OF LEARNING.</div>
          <h1>
            Meet the clock<span className="accent">.</span>
          </h1>
          <p>A focused session to see what you know.</p>
        </div>
        <Trophy size={28} className="accent" />
      </div>
      {error ? (
        <div role="alert" className="error-box" style={{ marginBottom: 20 }}>
          {error}
        </div>
      ) : null}
      {session ? (
        <section className="card" style={{ marginBottom: 24 }}>
          <div className="card-heading">
            <h2>
              {session.finished
                ? "Your session, in perspective."
                : "Your session is in progress."}
            </h2>
            <Badge kind={session.finished ? "clean" : "minor"}>
              {session.finished
                ? "Finished"
                : `${Math.max(0, Math.ceil((session.endsAt - now) / 60000))} min left`}
            </Badge>
          </div>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <div>
              <span className="stat-label">Solved</span>
              <div className="stat-value">
                {solved.size}
                <span>/ {session.problemIds.length}</span>
              </div>
            </div>
            <div>
              <span className="stat-label">Attempts</span>
              <div className="stat-value">{used.length}</div>
            </div>
            <div>
              <span className="stat-label">Watch exits recorded</span>
              <div className="stat-value">{exits}</div>
            </div>
            <div>
              <span className="stat-label">Mode</span>
              <div
                className="stat-value"
                style={{ fontSize: 24, textTransform: "capitalize" }}
              >
                {session.mode}
              </div>
            </div>
          </div>
          {session.problemIds.map((id) => {
            const p = problems.find((p) => p.id === id)!;
            return (
              <div className="review-mini" key={id}>
                <span className={solved.has(id) ? "success" : "muted"}>
                  {solved.has(id) ? <Check size={17} /> : <Flag size={17} />}
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <small>{p.topics[0]}</small>
                </div>
                <Badge kind={p.difficulty}>{p.difficulty}</Badge>
                {!session.finished ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void fullscreen()
                        .then(() => router.push(problemUrl(p)))
                        .catch(() =>
                          setError("Fullscreen is required to resume."),
                        );
                    }}
                  >
                    Open <ArrowRight size={13} />
                  </Button>
                ) : (
                  <Link className="text-link" href={problemUrl(p)}>
                    Practice →
                  </Link>
                )}
              </div>
            );
          })}
          {!session.finished ? (
            <div className="modal-actions">
              <Button variant="danger" onClick={() => setEnd(true)}>
                End session
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
      {!session || session.finished ? (
        <div className="detail-grid">
          <section className="card">
            <div className="card-heading">
              <h2>Set your challenge</h2>
            </div>
            <div className="form-stack">
              <div className="option-row">
                <button
                  className={`option-button ${mode === "contest" ? "active" : ""}`}
                  onClick={() => {
                    setMode("contest");
                    setCount(3);
                    setMinutes(60);
                  }}
                >
                  Contest
                </button>
                <button
                  className={`option-button ${mode === "mock" ? "active" : ""}`}
                  onClick={() => {
                    setMode("mock");
                    setCount(2);
                    setMinutes(45);
                  }}
                >
                  Mock interview
                </button>
              </div>
              <div className="field-grid">
                <label>
                  Problems
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Shared time
                  <select
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  >
                    {[15, 30, 45, 60, 90, 120].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Difficulty
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">Mix it up</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                </select>
              </label>
              <Button onClick={() => void start()}>
                <Maximize2 size={14} />
                Enter fullscreen & start
              </Button>
            </div>
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>
                <ShieldCheck size={17} className="accent" />
                Strict, and transparent.
              </h2>
            </div>
            <div className="stack">
              <p className="muted" style={{ fontSize: 13 }}>
                A random set of problems, one shared timer, and fullscreen to
                help you focus.
              </p>
              <div className="screen-note">
                Iwons Watch logs focus changes and fullscreen exits. Three exits
                flag a session. Optional auto-submit on the fourth exit is
                available in Settings.
              </div>
              <p className="muted" style={{ fontSize: 12 }}>
                Switch between problems from this lobby. The clock keeps
                running, even if you refresh. Timer expiry submits the open
                problem and ends the session.
              </p>
              <p className="muted" style={{ fontSize: 12 }}>
                Your code and results stay local, except when you explicitly
                choose a Java execution endpoint.
              </p>
            </div>
          </section>
        </div>
      ) : null}
      <Modal
        open={end}
        onClose={() => setEnd(false)}
        title="Finish this session?"
      >
        <p>
          Your submitted solutions will stay saved. Unsubmitted editor drafts
          are kept, but won’t count toward your session result.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setEnd(false)}>
            Keep going
          </Button>
          <Button
            onClick={() => {
              store.setSession({ contest: { ...session!, finished: true } });
              if (document.fullscreenElement) void document.exitFullscreen();
              setEnd(false);
              toast("Session complete. Take a breath.");
            }}
          >
            Finish session
          </Button>
        </div>
      </Modal>
      <Onboarding open={onboard} onClose={() => setOnboard(false)} />
    </div>
  );
}
