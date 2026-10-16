import Link from "next/link";
import { studyModules } from "@/lib/foundations/learn";
export function StudyFirst({units}:{units:string[]}) {
  const entries = studyModules(units);
  if (!entries.length) return null;
  return <aside className="local-note"><h3>Study this first</h3><p>Optional Data Structures and Algorithms course maps; lessons are coming soon. Your Path access stays the same.</p><ul>{entries.map(entry=><li key={entry.id}><Link prefetch={false} href={`/learn/java/data-structures-and-algorithms/${entry.slug}/`}>{entry.title}</Link></li>)}</ul></aside>;
}
