import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALGORITHM_REGISTRY, getAlgorithmMetadata } from '@/visualizer/registry';
import { VisualizerSlugClient } from '@/visualizer/components/visualizer-slug-client';

export const dynamicParams = false;

export function generateStaticParams() {
  return ALGORITHM_REGISTRY.map(algo => ({
    slug: algo.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getAlgorithmMetadata(slug);

  if (!meta) {
    return {
      title: 'Algorithm Not Found | Iwons Visualizer',
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${meta.name} | Algorithm Visualizer`,
    description: meta.blurb,
    alternates: { canonical: `/visualizer/${slug}/` },
    openGraph: {
      title: `${meta.name} — Interactive Visualizer | Iwons`,
      description: meta.blurb,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.name} — Interactive Visualizer | Iwons`,
      description: meta.blurb,
    },
  };
}

export default async function VisualizerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getAlgorithmMetadata(slug);

  if (!meta) {
    notFound();
  }

  return (
    <div className="content visualizer-page">
      <VisualizerSlugClient slug={slug} />
    </div>
  );
}
