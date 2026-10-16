import { ogImage } from "@/lib/og";
import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblems,getProblem,getLegacyProblems } from "@/lib/problems";
import { LegacyProblem } from "@/components/legacy-problem";
const problems=getProblems();
export const dynamicParams=false;
import { Workspace } from "@/components/workspace";
import { ProblemDescription } from "@/components/problem-description";
export function generateStaticParams() {
  return [...problems,...getLegacyProblems()].map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProblem(slug);
  if (!p) return {title:"A new chapter",robots:{index:false,follow:true},description:"The old exercise has retired. Your work is archived; explore the new Iwons Path."};
  return {
    title: p.title,
    description: p.descriptionMd.slice(0, 155),
    alternates: { canonical: `/problems/${slug}/` },
    openGraph: {
      title: `${p.title} | Iwons`,
      description: p.overview,
      images: [ogImage(slug)],
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.title} | Iwons`,
      images: [ogImage(slug)],
    },
  };
}
export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
