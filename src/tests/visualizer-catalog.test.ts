import { describe, it, expect } from 'vitest';
import {
  ALGORITHM_REGISTRY,
  CATEGORIES_LIST,
  ENGINES_LIST,
  getAlgorithmMetadata,
} from '../visualizer/registry';
import { generateStaticParams } from '../app/visualizer/[slug]/page';

describe('Phase V10: Visualizer Library Catalog & Routes', () => {
  it('generateStaticParams returns an entry for every algorithm in ALGORITHM_REGISTRY', () => {
    const params = generateStaticParams();
    expect(params.length).toBe(ALGORITHM_REGISTRY.length);
    expect(params.length).toBeGreaterThanOrEqual(50);

    const paramSlugs = new Set(params.map(p => p.slug));
    ALGORITHM_REGISTRY.forEach(algo => {
      expect(paramSlugs.has(algo.id), `Slug ${algo.id} should be present in static params`).toBe(true);
    });
  });

  it('getAlgorithmMetadata resolves metadata for every registered algorithm', () => {
    ALGORITHM_REGISTRY.forEach(algo => {
      const meta = getAlgorithmMetadata(algo.id);
      expect(meta).toBeDefined();
      expect(meta?.id).toBe(algo.id);
      expect(meta?.name.length).toBeGreaterThan(0);
      expect(meta?.blurb.length).toBeGreaterThan(10);
      expect(meta?.complexity.average).toBeDefined();
    });
  });

  it('every algorithm in ALGORITHM_REGISTRY has a defined category in CATEGORIES_LIST', () => {
    const definedCategoryIds = new Set(CATEGORIES_LIST.map(c => c.id));
    ALGORITHM_REGISTRY.forEach(algo => {
      expect(
        definedCategoryIds.has(algo.category),
        `Algorithm ${algo.id} has category ${algo.category} which must exist in CATEGORIES_LIST`
      ).toBe(true);
    });
  });

  it('every engine in ENGINES_LIST has at least one algorithm', () => {
    const engineIds = new Set(ALGORITHM_REGISTRY.map(a => a.engine));
    ENGINES_LIST.forEach(eng => {
      expect(engineIds.has(eng.id), `Engine ${eng.id} should power algorithms`).toBe(true);
    });
  });

  it('getVisualizerForProblem maps relevant problems to valid registered visualizers', async () => {
    const { getVisualizerForProblem } = await import('../visualizer/problem-map');
    const registeredIds = new Set(ALGORITHM_REGISTRY.map(a => a.id));

    const testCases = [
      { problem: { patterns: ['Binary search'] }, expectedSlug: 'binary-search' },
      { problem: { patterns: ['Two pointers'] }, expectedSlug: 'two-pointers-pair-sum' },
      { problem: { topics: ['Graph traversal', 'Breadth-first search'] }, expectedSlug: 'bfs-graph' },
      { problem: { patterns: ['Reverse linked list'] }, expectedSlug: 'reverse-linked-list' },
      { problem: { patterns: ['Dynamic programming', '0/1 Knapsack'] }, expectedSlug: 'knapsack-0-1' },
      { problem: { patterns: ['Unrelated topic', 'Basic math'] }, expectedSlug: null },
    ];

    testCases.forEach(({ problem, expectedSlug }) => {
      const match = getVisualizerForProblem(problem);
      if (expectedSlug === null) {
        expect(match).toBeNull();
      } else {
        expect(match).not.toBeNull();
        expect(match?.slug).toBe(expectedSlug);
        expect(registeredIds.has(match!.slug)).toBe(true);
      }
    });
  });
});

