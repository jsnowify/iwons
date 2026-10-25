import { creator } from "@/lib/creator";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALGORITHM_REGISTRY, getAlgorithmMetadata } from '@/visualizer/registry';
import { VisualizerSlugClient } from '@/visualizer/components/visualizer-slug-client';

import { siteUrl } from '@/lib/site-url';
import { ogImage } from '@/lib/og';

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
      title: 'Algorithm Not Found',
      robots: { index: false, follow: true },
    };
  }

  const title = `${meta.name} — Algorithm Visualizer`;
  return {
    title,
    description: meta.blurb,
    alternates: { canonical: `/visualizer/${slug}/` },
    openGraph: {
      title: `${title} | Iwons`,
      description: meta.blurb,
      url: `${siteUrl}/visualizer/${slug}/`,
      type: 'article',
      images: [{ url: `${siteUrl}${ogImage("home")}`, width: 1200, height: 630, alt: `${meta.name} Visualizer` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Iwons`,
      description: meta.blurb,
      images: [`${siteUrl}${ogImage("home")}`],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: `${meta.name} Algorithm Visualizer`,
              description: meta.blurb,
              educationalLevel: "All levels",
              learningResourceType: "Interactive Simulation",
              url: `${siteUrl}/visualizer/${slug}/`,
              keywords: `${meta.name}, ${meta.category}, algorithm visualizer, ${meta.engine} engine`,
              inLanguage: "en",
              isAccessibleForFree: true,
              author: creator,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Visualizer",
                  item: `${siteUrl}/visualizer/`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: meta.name,
                  item: `${siteUrl}/visualizer/${slug}/`,
                },
              ],
            },
          ]),
        }}
      />
      <VisualizerSlugClient slug={slug} />
    </div>
  );
}

