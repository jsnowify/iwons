import Link from "next/link";
import { notFound } from "next/navigation";
import { learnManifest } from "@/lib/foundations/learn";
import { isTrack, trackNames, baselines, courseSlugs, courseIdFromSlug, type MultiTrackExercise } from "@/lib/foundations/model-v2";
import { CourseProgress, HumanLanguagePicker, LearningExerciseLink, LearnRetry, PreferredCourseLink, TrackPicker } from "./learn-controls";
import { CloseTheBook } from "./close-the-book";
import { ModuleMastery } from "./module-mastery";
import type { Checkpoint } from "@/lib/foundations/types";
import { readLesson, readModule, readModuleFile } from "@/lib/foundations/lesson-content";
import { LessonActivity } from "./lesson-activity";
import { siteUrl } from "@/lib/site-url";
export function LearnPage({segments=[]}:{segments?:string[]}) {
  const [trackValue,courseId,moduleSlug,lessonSlug] = segments;
  if (segments.length > 4 || (trackValue && !isTrack(trackValue))) notFound();
  const track = isTrack(trackValue) ? trackValue : undefined;
  const course = courseId ? learnManifest.courses.find(item => item.id === courseIdFromSlug(courseId)) : undefined;
  const station = moduleSlug ? course?.modules.find(item => item.slug === moduleSlug) : undefined;
  if ((courseId && !course) || (moduleSlug && !station)) notFound();
  const lessonEntry=lessonSlug?station?.lessons.find(lesson=>lesson.slug===lessonSlug&&lesson.status==="ready"&&track&&lesson.availability[track]==="ready"):undefined;
  if(lessonSlug&&!lessonEntry)notFound();
  const lesson=lessonEntry&&track?readLesson(lessonEntry.variants[track]!.contentFile):undefined;
  const moduleContent=station?.status==="ready"&&course?readModule(course.id,station.slug):undefined;
  const exercises=moduleContent&&course&&station?moduleContent.exerciseFiles.map(file=>readModuleFile<MultiTrackExercise>(course.id,station.slug,file)):[];
  const checkpoint=moduleContent&&course&&station?readModuleFile<Checkpoint>(course.id,station.slug,moduleContent.checkpointFile):undefined;
  const title = lesson?.shared.translations.en.title ?? station?.title ?? course?.title ?? "A little learning. A lasting habit.";
  const activeTrack = track ?? "java";
  const structured=lesson&&course?{"@context":"https://schema.org","@type":"LearningResource",name:title,description:lesson.shared.translations.en.idea,learningResourceType:"Programming lesson",programmingLanguage:trackNames[activeTrack],isPartOf:{"@type":"Course",name:course.title},url:`${siteUrl}/learn/${segments.join("/")}/`}:course?{"@context":"https://schema.org","@type":"Course",name:course.title,description:course.description,provider:{"@type":"Organization",name:"Iwons"},url:`${siteUrl}/learn/${activeTrack}/${courseSlugs[course.id]}/`,programmingLanguage:trackNames[activeTrack]}:{"@context":"https://schema.org","@type":"ItemList",name:"Iwons courses",itemListElement:learnManifest.courses.map((item,index)=>({"@type":"ListItem",position:index+1,name:item.title,url:`${siteUrl}/learn/${activeTrack}/${courseSlugs[item.id]}/`}))};
  return <div className="learn-page">
    <nav aria-label="Learning breadcrumbs"><Link prefetch={false} href="/learn/">Learn</Link>{track ? <> / <Link prefetch={false} href={`/learn/${track}/`}>{trackNames[track]}</Link></> : null}{course ? <> / <Link prefetch={false} href={`/learn/${activeTrack}/${courseSlugs[course.id]}/`}>{course.title}</Link></> : null}</nav>
    <header className="learn-heading"><p className="manual-line">The Iwons learning desk</p><h1>{title}</h1><p>{station ? "Your module contents. Lessons open here as they become ready." : course?.description ?? "Start with programming, grow into algorithms, and put the ideas to work on the Path."}</p></header>
    <TrackPicker track={track} suffix={course ? `${courseSlugs[course.id]}/${station ? `${station.slug}/${lessonSlug?`${lessonSlug}/`:""}` : ""}` : ""}/>
    <HumanLanguagePicker/>
    {!course?<div className="learning-actions"><Link prefetch={false} className="btn secondary" href="/learn/session/">10-minute session</Link><Link prefetch={false} className="btn secondary" href="/learn/warm-up/">Daily Warm-up 3</Link></div>:null}
    {!course ? <p><Link prefetch={false} href="/learn/visualizers/">Visit the algorithm workbench</Link> or <Link prefetch={false} href="/learn/runtime/">check a code runtime</Link>.</p> : null}
    {track ? <p className="learn-baseline">{baselines[track]}</p> : <p>Choose a code track above. The same course map is available in all four languages.</p>}
    {!learnManifest.courses.length ? <section role="alert"><h2>The course index could not load.</h2><p>Your saved work is safe. Reload to try the index again.</p><LearnRetry/></section> : null}
    {!course ? <div className="learn-courses">{learnManifest.courses.map(item => {
      const lessons = item.modules.flatMap(entry => entry.lessons);
      const ready = lessons.filter(lesson => lesson.status === "ready" && lesson.availability[activeTrack] === "ready").length;
      const link=track ? <Link prefetch={false} href={`/learn/${track}/${courseSlugs[item.id]}/`}>{item.title}</Link> : <PreferredCourseLink course={item.id}>{item.title}</PreferredCourseLink>;
      return <article className="learn-course" key={item.id}><span className="learn-file-label">{item.title}</span><h2>{link}</h2><p>{item.description}</p><p>{ready} of {lessons.length} lessons ready</p><CourseProgress lessonIds={lessons.map(lesson => lesson.id)} track={track}/><p>{item.recommended}</p>{track?<Link prefetch={false} className="btn secondary" href={`/learn/${track}/${courseSlugs[item.id]}/`}>Open {item.title} course map</Link>:<PreferredCourseLink className="btn secondary" course={item.id}>Open {item.title} course map</PreferredCourseLink>}</article>;
    })}</div> : null}
    {course && !station ? <><p>{course.recommended} Course order is advice; the Path keeps its existing unlock rules.</p><ol className="learn-map">{course.modules.map((entry,index) => <li key={entry.id}><span className="learn-station" aria-hidden="true">{index+1}</span><div><h2><Link prefetch={false} href={`/learn/${activeTrack}/${courseSlugs[course.id]}/${entry.slug}/`}>{entry.title}</Link></h2><p>{entry.lessons.filter(lesson => lesson.status === "ready" && lesson.availability[activeTrack] === "ready").length} of {entry.lessons.length} lessons ready</p></div><span className="learn-stamp">{entry.status === "ready" ? "Ready" : "Coming soon"}</span></li>)}</ol></> : null}
    {station && course && !lesson ? <>{moduleContent?<><p>{moduleContent.copy.translations.en.intro}</p><p>{moduleContent.copy.translations.en.recallPrompt}</p></>:null}<p>{station.beforeYouStart}</p><ol className="learn-lessons">{station.lessons.map(lesson => <li key={lesson.id}>{lesson.status==="ready"&&lesson.availability[activeTrack]==="ready"?<Link prefetch={false} href={`/learn/${activeTrack}/${courseSlugs[course.id]}/${station.slug}/${lesson.slug}/`}>{lesson.title}</Link>:<span>{lesson.title}</span>}<span className="learn-stamp">{lesson.status==="ready"&&lesson.availability[activeTrack]==="ready"?"Ready":"Coming soon"}</span></li>)}</ol>{station.status!=="ready"?<p>These stations are planned. Lessons open after their content and interactions pass the checks.</p>:null}{station.practiceUnits.length ? <section><h2>Practise on the Path</h2><p>The existing practice sets are ready. You can visit them while these lessons are being written.</p><ul>{station.practiceUnits.map(unit => <PracticeUnit key={unit} unit={unit}/>)}</ul></section> : null}</> : null}
    {exercises.length&&station&&!lesson?<section><h2>Practice ladder</h2><p>Inspect a worked example, then choose the support you need. Hints and rung choices are optional.</p><ol className="learn-lessons">{exercises.filter(exercise=>exercise.variants[activeTrack]).map(exercise=><li key={exercise.id}><LearningExerciseLink slug={exercise.slug!} track={activeTrack}>{exercise.shared.translations.en.title}</LearningExerciseLink><span>{({worked:"Worked example",completion:"Complete",parsons:"Arrange",fix:"Repair",write:"Write"})[exercise.rung!]}</span></li>)}</ol></section>:null}
    {checkpoint&&track&&!lesson?<CloseTheBook checkpoint={checkpoint} track={track}/>:null}
    {station&&course&&!lesson?<ModuleMastery course={course.id} track={activeTrack} concepts={[...new Set(station.lessons.flatMap(lesson=>lesson.variants[activeTrack]?.concepts??[]))]}/>:null}
    {lesson&&track&&course&&station?<LessonActivity key={`${lesson.id}:${track}`} lesson={lesson} track={track} moduleHref={`/learn/${track}/${courseSlugs[course.id]}/${station.slug}/`}/>:null}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
  </div>;
}
import { problems } from "@/lib/catalog";
import { PracticeProgress } from "./learn-practice-progress";
function PracticeUnit({unit}:{unit:string}) {
  const entries = problems.filter(problem => problem.unit === unit);
  if (!entries.length) return <li>Practice set coming soon</li>;
  return <li><Link prefetch={false} href={`/path/${entries[0].level}/#${unit}`}>{unit.replaceAll("-"," ")}</Link> <PracticeProgress ids={entries.map(entry=>entry.id)}/></li>;
}
