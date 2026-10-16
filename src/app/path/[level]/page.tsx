import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLevels, getLevel, getProblems } from "@/lib/problems";
import { LevelAccess } from "@/components/path-map";
import unitData from "@/data/units.json";
export const dynamicParams = false;
export function generateStaticParams() {
  return getLevels().map((l) => ({ level: String(l.id) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}): Promise<Metadata> {
  const { level } = await params;
  const l = getLevel(Number(level));
  return l
    ? {
        title: `Level ${l.id}: ${l.name}`,
        description: `${l.subtitle} Learn ${l.concepts.join(", ").toLowerCase()} in the Iwons Path.`,
        alternates: { canonical: `/path/${l.id}/` },
      }
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  if (!/^\d$/.test(level)) notFound();
  const l = getLevel(Number(level));
  if (!l) notFound();
  const problems = getProblems().filter((p) => p.level === l.id);
  return (
    <div className="content">
      <Link href="/path/" className="text-link" style={{ marginBottom: 24 }}>
        <ArrowLeft size={12} />
        The whole Path
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            CHAPTER {l.id + 1} · {l.tier} · {l.count} EXERCISES
          </div>
          <h1>
            {l.name}
            <span className="accent">.</span>
          </h1>
          <p>{l.subtitle}</p>
        </div>
        <span className="level-key">0{l.id}</span>
      </div>
      <LevelAccess level={l} />
      <article className="primer">
        <h2 style={{ marginBottom: 20 }}>Before you start typing.</h2>
        <div className="primer-body">
          {l.primer.split("\n\n").map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {l.example ? (
          <div className="primer-example">
            <span
              className="eyebrow"
              style={{ display: "block", marginBottom: 12 }}
            >
              A LITTLE EXAMPLE
            </span>
            {l.example}
          </div>
        ) : null}
      </article>
      {problems.length ? (
        <section className="level-problems">
          <h2>Try your hand.</h2>
          {unitData.filter(unit => unit.level === l.id).map(unit => <section className="path-unit" key={unit.slug} id={unit.slug}>
          <h2>{unit.name}</h2><p>{unit.intro}</p>
          {problems.filter(p => p.unit === unit.slug).map((p, i) => (
            <Link
              href={`/problems/${p.slug}/`}
              className="level-problem-link"
              key={p.id}
            >
              <span className="level-key">{i + 1}</span>
              <div style={{ flex: 1 }}>
                <h3>{p.title}</h3>
                <p>{p.stage}{p.revisit ? ` · ${p.revisit}` : ""}</p>
              </div>
              <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
              <ArrowRight size={17} />
            </Link>
          ))}</section>)}
        </section>
      ) : null}
    </div>
  );
}
