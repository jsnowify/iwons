import type { Metadata } from 'next';
import { VisualizerCatalogView } from '@/visualizer/components/visualizer-catalog-view';

export const metadata: Metadata = {
  title: 'Algorithm Visualizer | Iwons',
  description:
    'Interactive algorithm workbench powered by 6 unified SVG engines. Step through 55+ search, sort, graph, tree, and dynamic programming algorithms.',
  alternates: { canonical: '/visualizer/' },
};

export default function VisualizerPage() {
  return (
    <div className="content visualizer-page">
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
