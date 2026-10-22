"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Play, Check, Code2 } from "lucide-react";
import { languageNames, problemUrl } from "@/lib/presentation";
import { useStore } from "@/store/use-store";
import { validateProblem } from "@/lib/validate-problem";
import type { Problem, Language } from "@/lib/types";
import { Button, useToast } from "./ui";
import { Workspace } from "./workspace";
import { ProblemDescription } from "./problem-description";
export function AuthorPage() {
  const store = useStore(),
    router = useRouter(),
    toast = useToast();
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [difficulty, setDifficulty] = useState("easy"),
    [fn, setFn] = useState("solve"),
    [topic, setTopic] = useState("Arrays & Hashing"),
    [cases, setCases] = useState(
      '[\n  { "input": [[1, 2, 3]], "expected": 6 }\n]',
    ),
    [hidden, setHidden] = useState("[]"),
    [starter, setStarter] = useState({
      javascript: "function solve(nums) {\n  // Your solution\n}\n",
      typescript: "function solve(nums: number[]): number {\n  return 0;\n}\n",
      python: "def solve(nums):\n    pass\n",
      java: "class Solution {\n    public int solve(int[] nums) {\n        return 0;\n    }\n}\n",
    }),
    [language, setLanguage] = useState<Language>("javascript"),
    [reference, setReference] = useState(""),
    [error, setError] = useState(""),
    [running, setRunning] = useState(false),
    [status, setStatus] = useState("");
  const file = useRef<HTMLInputElement>(null),
    cancel = useRef<AbortController | null>(null);
  useEffect(() => () => cancel.current?.abort(), []);
  function collect(): Problem {
    return validateProblem({
      title,
      descriptionMd: description,
      functionName: fn,
      difficulty,
      topics: topic
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      patterns: [topic.split(",")[0].trim()],
      starterCode: starter,
      cases: JSON.parse(cases),
      privateData: { hiddenCases: JSON.parse(hidden), editorialMd: "" },
    });
  }
  async function test() {
    setError("");
    setRunning(true);
    cancel.current = new AbortController();
    try {
      const p = collect();
      if (!reference.trim())
        throw new Error(
          "Add your reference solution before running the check.",
        );
      const { runCode } = await import("@/lib/runners");
      const r = await runCode(
        language,
        {
          code: reference,
          functionName: p.functionName,
          mode: p.mode,
          cases: [...p.cases, ...(p.privateData?.hiddenCases ?? [])],
          timeLimitMs: p.timeLimitMs,
        },
        store.settings,
        setStatus,
        cancel.current.signal,
      );
      if (r.verdict === "accepted")
        toast(`Reference passed all ${r.cases.length} cases.`);
      else
        setError(
          r.compileError?.message ??
            `${r.verdict}: ${r.cases.filter((c) => c.passed).length}/${r.cases.length} cases passed. ${r.cases.find((c) => !c.passed)?.error ?? ""}`,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the problem fields.");
    } finally {
      setRunning(false);
    }
  }
  function importProblem(text: string) {
    try {
      const raw = JSON.parse(text);
      const p = validateProblem(raw);
      store.addProblem(p);
      toast("Custom problem imported.");
      router.push(problemUrl(p));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not import that problem.",
      );
    }
  }
  return (
    <div className="content author-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TURN AN IDEA INTO A CHALLENGE.</div>
          <h1>
            Something worth solving<span className="accent">.</span>
          </h1>
          <p>Your statement, your cases, your own little challenge.</p>
        </div>
        <Button variant="secondary" onClick={() => file.current?.click()}>
          <Upload size={14} />
          Import JSON
        </Button>
        <input
          hidden
          type="file"
          ref={file}
          accept=".json,application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && f.size < 1024 * 1024) void f.text().then(importProblem);
            else setError("Choose a problem JSON file under 1 MB.");
          }}
        />
      </div>
      {error ? (
        <div className="error-box" role="alert" style={{ marginBottom: 24 }}>
          {error}
        </div>
      ) : null}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            const p = collect();
            store.addProblem(p);
            toast("Your challenge is ready.");
            router.push(problemUrl(p));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Check your fields.");
          }
        }}
      >
        <section className="card form-stack">
          <div className="card-heading" style={{ marginBottom: 0 }}>
            <h2>The problem</h2>
            <span className="eyebrow">01</span>
          </div>
          <label>
            Title
            <input
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum the readings"
            />
          </label>
          <label>
            Statement
            <textarea
              required
              rows={5}
              maxLength={20000}
            value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in your own words. Include what the function receives and returns."
            />
          </label>
          <div className="field-grid">
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              Topics <small>comma separated</small>
              <input maxLength={200} value={topic} onChange={(e) => setTopic(e.target.value)} />
            </label>
          </div>
          <label>
            Function name
            <input
              required
              maxLength={80}
              value={fn}
              onChange={(e) => setFn(e.target.value)}
              pattern="[A-Za-z_$][A-Za-z0-9_$]*"
            />
          </label>
        </section>
        <section className="card form-stack">
          <div className="card-heading" style={{ marginBottom: 0 }}>
            <h2>Give them a starting point</h2>
            <span className="eyebrow">02</span>
          </div>
          <div className="tabs">
            {Object.entries(languageNames).map(([v, label]) => (
              <button
                type="button"
                key={v}
                className={`tab ${language === v ? "active" : ""}`}
                onClick={() => setLanguage(v as Language)}
              >
                {label}
              </button>
            ))}
          </div>
          <label>
            Starter code · {languageNames[language]}
            <textarea
              required
              rows={8}
              className="mono"
              maxLength={20000}
              value={starter[language]}
              onChange={(e) =>
                setStarter((v) => ({ ...v, [language]: e.target.value }))
              }
            />
          </label>
          <p className="muted" style={{ fontSize: 11 }}>
            Use the same function name in every language. Java methods belong
            inside class Solution.
          </p>
        </section>
        <section className="card form-stack">
          <div className="card-heading" style={{ marginBottom: 0 }}>
            <h2>Make the expectations clear</h2>
            <span className="eyebrow">03</span>
          </div>
          <div className="field-grid">
            <label>
              Visible cases <small>JSON array</small>
              <textarea
                required
                rows={8}
                className="mono"
                maxLength={100000}
              value={cases}
                onChange={(e) => setCases(e.target.value)}
              />
            </label>
            <label>
              Hidden cases <small>JSON array</small>
              <textarea
                required
                rows={8}
                className="mono"
                maxLength={200000}
              value={hidden}
                onChange={(e) => setHidden(e.target.value)}
              />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 11 }}>
            Each case needs input (an array of function arguments) and expected.
            Custom hidden cases stay in local storage.
          </p>
          <label>
            Reference solution · {languageNames[language]}
            <textarea
              rows={7}
              className="mono"
              maxLength={20000}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Test your own solution against all the cases before saving."
            />
          </label>
          <div className="between">
            <small className="muted" role="status">
              {running ? status : "A good challenge has good edge cases."}
            </small>
            <Button
              type="button"
              variant="secondary"
              loading={running}
              onClick={() => void test()}
            >
              <Play size={13} />
              Test reference
            </Button>
          </div>
        </section>
        <div className="between">
          <span className="muted" style={{ fontSize: 11 }}>
            Saved on this device. Included in your Iwons backup.
          </span>
          <Button type="submit" disabled={running}>
            <Plus size={14} />
            Create problem
          </Button>
        </div>
      </form>
      <details style={{ marginTop: 24 }}>
        <summary className="text-link">See the JSON import format</summary>
        <pre className="code-view" style={{ marginTop: 16 }}>
          {JSON.stringify(
            {
              title: "Sum the readings",
              difficulty: "easy",
              descriptionMd: "Return the sum of an integer array.",
              functionName: "solve",
              starterCode: starter,
              cases: [{ input: [[1, 2, 3]], expected: 6 }],
              privateData: {
                hiddenCases: [{ input: [[]], expected: 0 }],
                editorialMd: "",
              },
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
export function CustomWorkspace() {
  const store = useStore();
  const [id, setId] = useState("");
  useEffect(
    () => setId(new URLSearchParams(location.search).get("id") ?? ""),
    [],
  );
  const p = store.customProblems.find((p) => p.id === id);
  if (!store.hydrated)
    return (
      <div className="content">
        <h1 className="sr-only">Custom problem workspace</h1>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  if (!p)
    return (
      <div className="content">
        <h1>That custom problem isn’t on this device.</h1>
        <p className="muted">
          Import its Iwons backup or create a new challenge.
        </p>
      </div>
    );
  return (
    <Workspace
      key={p.id}
      problem={p}
      description={<ProblemDescription problem={p} />}
    />
  );
}
