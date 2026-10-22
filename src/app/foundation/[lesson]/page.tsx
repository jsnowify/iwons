import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { foundationLessons, foundationTotal, neighbourLessons, outlinePosition } from "@/lib/foundation-track";
import { FoundationLessonBody } from "@/components/foundation-lesson";

export const dynamicParams = false;
export function generateStaticParams() {
  return foundationLessons.map(lesson => ({ lesson: lesson.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson: id } = await params;
  const lesson = foundationLessons.find(item => item.id === id);
  return lesson ? { title: `${lesson.title} | Foundation`, description: lesson.summary, alternates: { canonical: `/foundation/${lesson.id}/` } } : {};
}
export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: id } = await params;
  const lesson = foundationLessons.find(item => item.id === id);
  const position = outlinePosition(id);
  if (!lesson || !position) notFound();
  const { previous, next } = neighbourLessons(id);
  return <div className="content foundation-page">
    <Link href="/foundation/" className="text-link">All Foundation lessons</Link>
    <article className="foundation-lesson">
      <header className="foundation-header">
        <p>{position.module.title} · Lesson {position.number} of {foundationTotal} · {lesson.type === "code" ? "Code lesson, JavaScript or Python" : "Concept lesson"} · Optional</p>
        <h1>{lesson.title}</h1>
        <div className="foundation-explanation">{lesson.explanation.map(sentence => <p key={sentence}>{sentence}</p>)}</div>
      </header>
      <FoundationLessonBody key={lesson.id} lesson={lesson} />
      <nav className="row foundation-actions foundation-navigation" aria-label="Lesson navigation">
        {previous ? <Link className="btn secondary" href={`/foundation/${previous}/`}>Previous lesson</Link> : null}
        {next ? <Link className="btn secondary" href={`/foundation/${next}/`}>Next lesson</Link> : <Link className="btn secondary" href="/foundation/">All lessons</Link>}
        <Link className="text-link" href="/problems/">Go to challenges anytime</Link>
      </nav>
    </article>
  </div>;
}
