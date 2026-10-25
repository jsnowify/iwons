import type { Metadata } from 'next';
import { withSocial } from "@/lib/social-meta";
import { VisualizerCatalogView } from '@/visualizer/components/visualizer-catalog-view';

import { siteUrl } from '@/lib/site-url';
import { ALGORITHM_REGISTRY } from '@/visualizer/registry';

export const metadata: Metadata = withSocial({
  title: 'Algorithm Visualizer',
  description:
    'Interactive algorithm workbench powered by 6 unified SVG engines. Step through 67 search, sort, graph, tree, and dynamic programming algorithms.',
  alternates: { canonical: '/visualizer/' },
});

export default function VisualizerPage() {
  return (
    <div className="content visualizer-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Algorithm Visualizer Library",
              description:
                "Interactive algorithm workbench powered by 6 unified SVG engines. Step through 67 search, sort, graph, tree, and dynamic programming algorithms.",
              url: `${siteUrl}/visualizer/`,
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Computer Science Algorithms",
              itemListElement: ALGORITHM_REGISTRY.map((algo, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: algo.name,
                url: `${siteUrl}/visualizer/${algo.id}/`,
              })),
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
              ],
            },
          ]),
        }}
      />
      <div className="page-heading">
        <div>
          <div className="eyebrow">ONE STEP. ONE USEFUL IDEA.</div>
          <h1>Algorithm Visualizer</h1>
          <p>
            Choose an algorithm and trace its execution frame by frame. Step at your own pace, inspect memory and pointers, or scrub the timeline.
          </p>
        </div>
      </div>
      <VisualizerCatalogView />
    </div>
  );
}
