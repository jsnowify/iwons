import { notFound } from "next/navigation";
import { LearningDemo } from "@/components/learning-demo";
import demo from "@/data/learning-demo.json";
import type { EngineLesson } from "@/lib/foundations/lesson-engine";
export const metadata={title:"Learning tool checks",robots:{index:false,follow:false}};
export default function Page(){if(process.env.NODE_ENV==="production")notFound();return <div className="learn-page"><h1>Learning tool checks</h1><p>Temporary samples. These are not course lessons and do not award progress.</p><LearningDemo lesson={demo as EngineLesson}/></div>;}
