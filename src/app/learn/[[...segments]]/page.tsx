import type { Metadata } from "next";
import { LearnPage } from "@/components/learn-page";
import { learnPaths, learnManifest, legacyLearnPaths, canonicalLearnSegments } from "@/lib/foundations/learn";
import { isTrack, trackNames, courseIdFromSlug } from "@/lib/foundations/model-v2";
import { readLesson } from "@/lib/foundations/lesson-content";
import { LegacyLearnRedirect } from "@/components/legacy-learn-redirect";
export const dynamicParams = false;
export function generateStaticParams() { return [...learnPaths(), ...legacyLearnPaths()].map(segments=>({segments})); }
export async function generateMetadata({params}:{params:Promise<{segments?:string[]}>}):Promise<Metadata> {
  const {segments:requested=[]} = await params;
  const segments = canonicalLearnSegments(requested);
  const [track,courseId,moduleSlug,lessonSlug] = segments;
  const course = learnManifest.courses.find(item=>item.id===courseIdFromSlug(courseId));
  const station = course?.modules.find(item=>item.slug===moduleSlug);
  const lesson=station?.lessons.find(lesson=>lesson.slug===lessonSlug);
  const lessonBody=lesson&&isTrack(track)&&lesson.variants[track]?readLesson(lesson.variants[track]!.contentFile):undefined;
  const title = `${lesson ? `${lesson.title} | ${course?.title}` : station ? `${course?.title}: ${station.title}` : course?.title ?? "Learn to code"}${isTrack(track) ? ` in ${trackNames[track]}` : ""}`;
  return {title,robots: requested.join("/") !== segments.join("/") || station?.status !== "ready" && station ? {index:false,follow:true} : undefined,description:lessonBody?lessonBody.shared.translations.en.idea.slice(0,155):station ? `Explore the ${station.title} module in ${isTrack(track)?trackNames[track]:track}. Planned lessons remain visible as Coming soon.` : course?.description ?? "Programming and algorithms course maps in four code tracks.",alternates:{canonical:`/learn/${segments.length ? segments.join("/")+"/" : ""}`}};
}
export default async function Page({params}:{params:Promise<{segments?:string[]}>}) { const {segments=[]}=await params; const canonical=canonicalLearnSegments(segments); return canonical.join("/") !== segments.join("/") ? <LegacyLearnRedirect href={`/learn/${canonical.join("/")}/`}/> : <LearnPage segments={segments}/>; }
