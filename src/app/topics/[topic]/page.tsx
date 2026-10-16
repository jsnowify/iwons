import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { topics, topicSlug } from "@/lib/catalog";
import { ProblemList } from "@/components/problem-list";
export const dynamicParams = false;
export function generateStaticParams() {
  return topics.map((t) => ({ topic: topicSlug(t) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const title = topics.find((t) => topicSlug(t) === topic) || "Coding patterns";
  return {
    title: `${title} practice`,
    description: `Learn ${title.toLowerCase()} through original coding challenges with examples, constraints, and four language runtimes.`,
    alternates: { canonical: `/topics/${topic}/` },
  };
}
export default async function Topic({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = topics.find((t) => topicSlug(t) === topic);
  if (!t) notFound();
  return <ProblemList initialTopic={t} />;
}
