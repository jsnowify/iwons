import { notFound } from "next/navigation";
import { learnManifest } from "@/lib/foundations/learn";
import { tracks } from "@/lib/foundations/model-v2";
import { validateLearnManifest } from "@/lib/foundations/validate-v2";
import curriculum from "@/data/curriculum.json";
export const metadata = {title:"Content diagnostics",robots:{index:false,follow:false}};
export default function ContentDiagnostics() {
  if (process.env.NODE_ENV === "production") notFound();
  const errors=validateLearnManifest(learnManifest,[...new Set(curriculum.map(entry=>entry.unit))]);
  return <div className="learn-page"><h1>Content diagnostics</h1><p>Manifest schema {learnManifest.schemaVersion}. {learnManifest.courses.flatMap(course=>course.modules).filter(entry=>entry.status==="ready").length} modules ready. Java browser availability requires a configured endpoint and does not block native authoring checks.</p><h2>Validator errors</h2>{errors.length?<ul>{errors.map(error=><li key={error}>{error}</li>)}</ul>:<p>No structure errors.</p>}{learnManifest.courses.map(course=><section key={course.id}><h2>{course.title}</h2>{course.modules.map(entry=><details key={entry.id}><summary>{entry.title} — {entry.status}</summary><ul>{entry.lessons.map(lesson=><li key={lesson.id}>{lesson.id}: {lesson.status}; {tracks.map(track=>`${track}: ${lesson.availability[track]}`).join(", ")}; human languages: {lesson.languages.join(", ")}</li>)}</ul></details>)}</section>)}</div>;
}
