"use client";
import { memo, useState } from "react";
import { Check, Plus, Terminal, X, Loader2 } from "lucide-react";
import { verdictNames } from "@/lib/presentation";
import type { RunResult, TestCase } from "@/lib/types";
import { Button } from "./ui";
export const ResultsPanel = memo(function ResultsPanel({
  result,
  tests,
  running,
  status,
  custom,
  onCustom,
  failureInput,
}: {
  result: RunResult | null;
  tests: TestCase[];
  running: boolean;
  status: string;
  custom: string;
  onCustom: (s: string) => void;
  failureInput?: unknown[];
}) {
  const [tab, setTab] = useState("testcases"),
    [index, setIndex] = useState(0);
  const test = tests[Math.min(index, tests.length - 1)],
    r = result?.cases[Math.min(index, result.cases.length - 1)];
  const failed = result?.cases.find((c) => !c.passed);
  const selectedFailed = failed ? tests.find((t) => t.id === failed.id) : null;
  return (
    <section className="results-panel" aria-label="Execution results">
      <div className="tabs">
        <button
          className={`tab ${tab === "testcases" ? "active" : ""}`}
          onClick={() => setTab("testcases")}
        >
          Test cases
        </button>
        <button
          className={`tab ${tab === "result" ? "active" : ""}`}
          onClick={() => setTab("result")}
        >
          Result{" "}
          {result ? (
            <span
              className={result.verdict === "accepted" ? "success" : "danger"}
            >
              ●
            </span>
          ) : null}
        </button>
        <button
          className={`tab ${tab === "custom" ? "active" : ""}`}
          onClick={() => setTab("custom")}
        >
          Custom <Plus size={10} style={{ display: "inline" }} />
        </button>
        <button
          className={`tab ${tab === "console" ? "active" : ""}`}
          onClick={() => setTab("console")}
        >
          Console
        </button>
      </div>
      <div className="results-content" aria-live="polite">
        {running ? (
          <div className="row muted" style={{ fontSize: 12 }}>
            <Loader2 size={16} className="animate-spin" />
            {status}
          </div>
        ) : tab === "custom" ? (
          <div className="stack" style={{ gap: 12 }}>
            <label>
              Custom cases{" "}
              <small>JSON array of {"{ input: [...], expected: ... }"}</small>
              <textarea
                rows={3}
                className="mono"
                value={custom}
                onChange={(e) => onCustom(e.target.value)}
                placeholder={'[{"input": [[1, 2], 3], "expected": [0, 1]}]'}
              />
            </label>
            <small className="muted">
              Custom cases are included with Run. Submit uses the official
              visible and hidden cases.
            </small>
          </div>
        ) : tab === "console" ? (
          <pre className="muted">
            {result?.cases
              .map((c) => c.stdout)
              .filter(Boolean)
              .join("\n") || "Console output will appear here."}
          </pre>
        ) : tab === "result" ? (
          result ? (
            <>
              <div
                className={`verdict ${result.verdict === "accepted" ? "success" : result.verdict === "time_limit" ? "warning" : "danger"}`}
              >
                {result.verdict === "accepted" ? (
                  <Check size={18} />
                ) : (
                  <X size={18} />
                )}{" "}
                {verdictNames[result.verdict]}
                <span className="meta">
                  {result.cases.filter((c) => c.passed).length} /{" "}
                  {result.cases.length} passed
                </span>
              </div>
              {result.compileError ? (
                <pre className="danger">{result.compileError.message}</pre>
              ) : failed ? (
                <>
                  <div className="case-field" style={{ marginBottom: 12 }}>
                    <label>First failing input</label>
                    <pre>
                      {JSON.stringify(
                        failureInput ?? selectedFailed?.input ?? "Hidden case",
                      )}
                    </pre>
                  </div>
                  <div className="case-fields">
                    <div className="case-field">
                      <label>Expected</label>
                      <pre className="success">
                        {JSON.stringify(failed.expected)}
                      </pre>
                    </div>
                    <div className="case-field">
                      <label>Actual</label>
                      <pre className="danger">
                        {failed.error || JSON.stringify(failed.actual)}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <p className="muted" style={{ fontSize: 12 }}>
                  All test cases passed.{" "}
                  {result.cases.reduce((s, c) => s + c.runtimeMs, 0).toFixed(2)}{" "}
                  ms total execution time.
                </p>
              )}
            </>
          ) : (
            <p className="muted" style={{ fontSize: 12 }}>
              Run your code to see what clicks.
            </p>
          )
        ) : (
          <>
            <div className="test-tabs">
              {tests.map((c, i) => (
                <button
                  className={`test-tab ${index === i ? "active" : ""}`}
                  key={c.id}
                  onClick={() => setIndex(i)}
                >
                  {result?.cases[i] ? (
                    <span
                      className={result.cases[i].passed ? "success" : "danger"}
                    >
                      {result.cases[i].passed ? "●" : "×"}
                    </span>
                  ) : null}
                  Case {i + 1}
                </button>
              ))}
            </div>
            {test ? (
              <div className="case-fields">
                <div className="case-field">
                  <label>Input</label>
                  <pre>{JSON.stringify(test.input)}</pre>
                </div>
                <div className="case-field">
                  <label>{r ? "Actual → expected" : "Expected"}</label>
                  <pre>
                    {r ? `${r.error || JSON.stringify(r.actual)} → ` : ""}
                    {JSON.stringify(test.expected)}
                  </pre>
                </div>
              </div>
            ) : null}
            {result ? (
              <Button
                variant="ghost"
                className="small"
                onClick={() => setTab("result")}
              >
                View verdict →
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
});
