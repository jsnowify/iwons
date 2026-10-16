"use client";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { tracks, trackNames, courseSlugs, type LearnCourseId, type Track } from "@/lib/foundations/model-v2";
import { lessonLanguageNames,isLessonLanguage } from "@/lib/foundations/translations";
export function HumanLanguagePicker() {
 const language=useStore(state=>state.settings.lessonLanguage),update=useStore(state=>state.updateSettings);
 return <div className="learn-language"><label>Lesson language<select value={language} onChange={event=>{if(isLessonLanguage(event.target.value))update({lessonLanguage:event.target.value});}}>{Object.entries(lessonLanguageNames).map(([value,name])=><option value={value} key={value}>{name}</option>)}</select></label>{language!=="en"?<p>Not translated yet. This course map uses English; your lesson-language preference is saved separately from the code track.</p>:null}</div>;
}
export function PreferredCourseLink({course,children,className}:{course:LearnCourseId;children:React.ReactNode;className?:string}) {
 const track=useStore(state=>state.settings.codeTrack);
 return <Link prefetch={false} className={className} href={`/learn/${track}/${courseSlugs[course]}/`}>{children}</Link>;
}
export function TrackPicker({ track, suffix = "" }: {track?:Track;suffix?:string}) {
  const preferred = useStore(state => state.settings.codeTrack);
  const update = useStore(state => state.updateSettings);
  return <nav className="learn-tracks" aria-label="Code track">{tracks.map(value => <Link prefetch={false} key={value} href={`/learn/${value}/${suffix}`} aria-current={(track ?? preferred) === value ? "page" : undefined} onClick={() => update({codeTrack:value})}>{trackNames[value]}</Link>)}</nav>;
}
export function CourseProgress({ lessonIds, track:explicitTrack }: {lessonIds:string[];track?:Track}) {
  const progress = useStore(state => state.foundations);
  const preferred=useStore(state=>state.settings.codeTrack);
  const track=explicitTrack??preferred;
  const perTrack = progress[track];
  const read = lessonIds.filter(id => perTrack?.lessonsRead[id]).length;
  return <p className="learn-progress">Your progress: {read} of {lessonIds.length} lessons read in {trackNames[track]}.</p>;
}
export function LearnRetry() { return <button type="button" className="btn" onClick={() => window.location.reload()}>Retry loading courses</button>; }

export function LearningExerciseLink({slug,track,children}:{slug:string;track:Track;children:React.ReactNode}){
 const update=useStore(state=>state.updateSettings);
 return <Link prefetch={false} href={`/problems/${slug}/`} onClick={()=>update({codeTrack:track})}>{children}</Link>;
}
