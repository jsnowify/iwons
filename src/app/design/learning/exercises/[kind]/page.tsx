import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningWorkspace } from "@/components/learning-workspace";
import samples from "@/data/learning-exercises-demo.json";
import type { MultiTrackExercise } from "@/lib/foundations/model-v2";
export const dynamicParams=false;
export function generateStaticParams(){return [{kind:"program"},{kind:"parsons"}];}
export const metadata:Metadata={title:"Learning workspace checks",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;const sample=(samples as unknown as MultiTrackExercise[]).find(exercise=>exercise.kind===kind);
 if(!sample)notFound();
 return <><p className="local-note">Temporary design-system sample. It does not award progress or XP.</p><LearningWorkspace exercise={sample} description={<p>{sample.shared.translations.en.statement}</p>} moduleHref="/design/learning/" preview/></>;
}
