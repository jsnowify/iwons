import Link from "next/link";
import type { Problem } from "@/lib/types";
import { problems, problemUrl, topicSlug } from "@/lib/catalog";
export function ProblemDescription({ problem: p }: { problem: Problem }) {
  const related = problems
    .filter((x) => x.id !== p.id && x.topics.some((t) => p.topics.includes(t)))
    .slice(0, 3);
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
      {p.unit ? <Link prefetch={false} className="text-link" href={`/path/${p.level}/#${p.unit}`}>Back to this unit</Link> : null}
      {p.stage ? <p><strong>{p.stage}</strong>{p.revisit ? ` · ${p.revisit}` : ""}</p> : null}
      {p.descriptionMd.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <h2>Examples</h2>
      {p.cases.map((c, i) => (
        <div className="example" key={c.id}>
          <strong>Example {i + 1}</strong>
          <pre>
            <span className="muted">Input: </span>
            {JSON.stringify(c.input)}
            {`\n`}
            <span className="muted">Output: </span>
            {JSON.stringify(c.expected)}
          </pre>
          {c.explanation ? <p>{c.explanation}</p> : null}
        </div>
      ))}
      <h2>Constraints</h2>
      <ul className="constraint-list">
        {p.constraints.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
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
              <Link prefetch={false} className="text-link" href={problemUrl(r)} key={r.id}>
                {r.title} →
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}
