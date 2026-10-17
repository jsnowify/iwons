import Link from "next/link";
import type { Problem, ProblemSummary } from "@/lib/types";
import { problemUrl, topicSlug } from "@/lib/presentation";
import { getVisualizerForProblem } from "@/visualizer/problem-map";
export function ProblemDescription({ problem: p, related = [] }: { problem: Problem; related?: Pick<ProblemSummary,"id"|"slug"|"title">[] }) {
  const visualizer = getVisualizerForProblem(p);
  return (
    <article className="description-content">
      <span className="eyebrow">
        {p.id.startsWith('custom-')?'YOUR COLLECTION':`LEVEL ${p.level}`} · {p.topics[0]}
      </span>
      <h1>{p.title}</h1>
      <div className="description-tags">
        <span className={`badge ${p.difficulty}`}>
          {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
        </span>
        {p.patterns.map((t) => (
          <span className="chip" key={t}>
            {t}
          </span>
        ))}
      </div>
      {visualizer ? (
        <p className="visualizer-hint" style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
          <span className="muted">Stuck or curious how this works? </span>
          <Link
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link accent"
            href={`/visualizer/${visualizer.slug}/`}
          >
            Visualize {visualizer.name} ↗
          </Link>
        </p>
      ) : null}
      {p.unit ? <Link prefetch={false} className="text-link" href={`/path/${p.level}/#${p.unit}`}>Back to this unit</Link> : null}
      {p.stage ? <p><strong>{p.stage}</strong>{p.revisit ? ` · ${p.revisit}` : ""}</p> : null}
      {p.descriptionMd.split("\n\n").map((paragraph, index) => {
        const [heading, ...body] = paragraph.split("\n");
        return body.length && ["Your task", "Inputs", "Step 1: Build the result list", "Step 2: Return the answer", "Write your function"].includes(heading)
          ? <section key={index}><h2>{heading}</h2><p>{body.join(" ")}</p></section>
          : <p key={index}>{paragraph}</p>;
      })}
      <h2>Examples</h2>
      {p.cases.map((c, i) => (
        <div className="example" key={c.id}>
          <strong>Example {i + 1}</strong>
          <pre>
            <span className="muted">Input: </span>
            {p.parameterNames ? c.input.map((value, index) => `${p.parameterNames![index] ?? `argument ${index + 1}`} = ${JSON.stringify(value)}`).join("\n") : JSON.stringify(c.input)}
            {`\n`}
            <span className="muted">Output: </span>
            {JSON.stringify(c.expected)}
          </pre>
          {c.explanation ? <p>{c.explanation}</p> : null}
        </div>
      ))}
      <h2>Input limits</h2>
      <ul className="constraint-list">
        {p.constraints.filter(c => !c.startsWith("Efficiency goal:")).map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {p.constraints.some(c => c.startsWith("Efficiency goal:")) ? <details className="efficiency-goal"><summary>Efficiency goal</summary><p>Big-O describes how the work or memory needed grows as the input gets larger.</p>{p.constraints.filter(c => c.startsWith("Efficiency goal:")).map(c => <p key={c}>{c}</p>)}</details> : null}
      <h2>Practice focus</h2>
      <p>{p.overview}</p>
      {p.topics.map((t) => (
        <Link
          prefetch={false}
          href={`/topics/${topicSlug(t)}/`}
          className="text-link accent"
          key={t}
        >
          Explore {t.toLowerCase()} →
        </Link>
      ))}
      {related.length ? (
        <>
          <h2>Keep the pattern going</h2>
          <div className="stack" style={{ gap: 12 }}>
            {related.map((r) => (
              <Link className="text-link" href={problemUrl(r)} key={r.id}>
                {r.title} →
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}
