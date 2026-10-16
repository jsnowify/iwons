import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblems,getProblem,getLegacyProblems } from "@/lib/problems";
import { LegacyProblem } from "@/components/legacy-problem";
import { getLearnExercises } from "@/lib/foundations/lesson-content";
import { courseSlugs, trackNames } from "@/lib/foundations/model-v2";
import { LearningWorkspace } from "@/components/learning-workspace";
const problems=getProblems();
export const dynamicParams=false;
import { Workspace } from "@/components/workspace";
import { ProblemDescription } from "@/components/problem-description";
export function generateStaticParams() {
  return [...problems,...getLegacyProblems(),...getLearnExercises().map(entry=>({slug:entry.exercise.slug!}))].map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const learned=getLearnExercises().find(entry=>entry.exercise.slug===slug);
  if(learned){const copy=learned.exercise.shared.translations.en;return {title:`${copy.title} | ${learned.course.title}`,description:copy.statement.slice(0,155),alternates:{canonical:`/problems/${slug}/`},openGraph:{title:copy.title,description:copy.statement.slice(0,155),images:[`/og/${slug}/`]}};}
  const p = getProblem(slug);
  if (!p) return {title:"A new chapter",robots:{index:false,follow:true},description:"The old exercise has retired. Your work is archived; explore the new Iwons Path."};
  return {
    title: p.title,
    description: p.descriptionMd.slice(0, 155),
    alternates: { canonical: `/problems/${slug}/` },
    openGraph: {
      title: `${p.title} | Iwons`,
      description: p.overview,
      images: [`/og/${slug}/`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.title} | Iwons`,
      images: [`/og/${slug}/`],
    },
  };
}
export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const learningEntries=getLearnExercises(),learned=learningEntries.find(entry=>entry.exercise.slug===slug);
  if(learned){
    const {exercise,course,module}=learned,copy=exercise.shared.translations.en;
    const siblings=learningEntries.filter(entry=>entry.module.id===module.id),index=siblings.findIndex(entry=>entry.exercise.id===exercise.id),next=siblings[index+1];
    const json={"@context":"https://schema.org","@type":"LearningResource",name:copy.title,description:copy.statement,learningResourceType:"Programming exercise",programmingLanguage:Object.keys(exercise.variants).map(track=>trackNames[track as keyof typeof trackNames]),url:`${siteUrl}/problems/${slug}/`,isPartOf:{"@type":"Course",name:course.title}};
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,"\\u003c")}}/><LearningWorkspace courseTitle={course.title} exercise={exercise} description={<>{copy.statement.split("\n\n").map(paragraph=><p key={paragraph}>{paragraph}</p>)}</>} moduleHref={`/learn/java/${courseSlugs[course.id]}/${module.slug}/`} nextHref={next?`/problems/${next.exercise.slug}/`:undefined}/></>;
  }
  const p = getProblem(slug);
  if (!p) {if(getLegacyProblems().some(x=>x.slug===slug))return <LegacyProblem/>;notFound();}
  const site = siteUrl;
  const json = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: p.title,
      description: p.descriptionMd,
      educationalLevel: p.difficulty,
      learningResourceType: "Coding exercise",
      url: `${site}/problems/${p.slug}/`,
      keywords: [...p.topics, ...p.patterns].join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Iwons", item: site },
        {
          "@type": "ListItem",
          position: 2,
          name: "Problems",
          item: `${site}/problems/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: p.title,
          item: `${site}/problems/${p.slug}/`,
        },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(json).replace(/</g, "\\u003c"),
        }}
      />
      <Workspace problem={p} description={<ProblemDescription problem={p} />} />
    </>
  );
}
