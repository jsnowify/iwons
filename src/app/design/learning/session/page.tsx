import { TenMinuteSession } from "@/components/ten-minute-session";
import lessonData from "@/data/learning-demo.json";
import exercises from "@/data/learning-exercises-demo.json";
import { tracks, type MultiTrackExercise } from "@/lib/foundations/model-v2";
import type { EngineLesson } from "@/lib/foundations/lesson-engine";
export const metadata={title:"Learning session checks",robots:{index:false,follow:false}};
export default function Page(){
 const lesson=lessonData as EngineLesson,exercise=exercises[0] as unknown as MultiTrackExercise;
 return <div className="learn-page"><p>Temporary session preview. No progress or XP is awarded.</p><TenMinuteSession entries={tracks.map(track=>({track,lessonId:lesson.id,title:lesson.shared.translations.en.title,exerciseId:exercise.id,moduleHref:"/design/learning/"}))} catalogue={[]} preview previewData={{lesson,exercise}}/></div>;
}
