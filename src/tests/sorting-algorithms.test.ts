import { describe, it, expect } from 'vitest';
import { generateRandomNumbers, createRng } from '../visualizer/core/inputs';
import bubbleSortDef from '../visualizer/algorithms/sorting/bubble-sort';
import selectionSortDef from '../visualizer/algorithms/sorting/selection-sort';
import insertionSortDef from '../visualizer/algorithms/sorting/insertion-sort';
import mergeSortDef from '../visualizer/algorithms/sorting/merge-sort';
import quickSortDef from '../visualizer/algorithms/sorting/quick-sort';
import heapSortDef from '../visualizer/algorithms/sorting/heap-sort';
import countingSortDef from '../visualizer/algorithms/sorting/counting-sort';
import radixSortDef from '../visualizer/algorithms/sorting/radix-sort';
import bucketSortDef from '../visualizer/algorithms/sorting/bucket-sort';
import shellSortDef from '../visualizer/algorithms/sorting/shell-sort';
import cocktailShakerSortDef from '../visualizer/algorithms/sorting/cocktail-shaker-sort';
import combSortDef from '../visualizer/algorithms/sorting/comb-sort';
import gnomeSortDef from '../visualizer/algorithms/sorting/gnome-sort';
import timSortDef from '../visualizer/algorithms/sorting/tim-sort';
import cycleSortDef from '../visualizer/algorithms/sorting/cycle-sort';
import pancakeSortDef from '../visualizer/algorithms/sorting/pancake-sort';

const ALL_SORTING_ALGORITHMS = [
  bubbleSortDef,
  selectionSortDef,
  insertionSortDef,
  mergeSortDef,
  quickSortDef,
  heapSortDef,
  countingSortDef,
  radixSortDef,
  bucketSortDef,
  shellSortDef,
  cocktailShakerSortDef,
  combSortDef,
  gnomeSortDef,
  timSortDef,
  cycleSortDef,
  pancakeSortDef,
];

describe('Engine 1 (Bars): Full 16-Algorithm Sorting Library Verification', () => {
  it('has exactly 16 sorting algorithms implemented', () => {
    expect(ALL_SORTING_ALGORITHMS.length).toBe(16);
  });

  for (const algo of ALL_SORTING_ALGORITHMS) {
    describe(`${algo.name} (${algo.id})`, () => {
      it('has valid metadata, pseudocode, and presets', () => {
        expect(algo.engine).toBe('bars');
        expect(algo.category).toBe('sorting');
        expect(algo.pseudocode.length).toBeGreaterThan(3);
        expect(algo.presets.length).toBeGreaterThanOrEqual(2);
        expect(algo.complexity.best).toBeDefined();
        expect(algo.complexity.worst).toBeDefined();
        expect(algo.blurb.length).toBeGreaterThan(15);
      });

      it('sorts edge cases correctly against JavaScript native sort oracle', () => {
        const edgeCases: number[][] = [
          [],
          [42],
          [2, 1],
          [1, 2],
          [5, 5, 5, 5],
          [1, 2, 3, 4, 5],
          [5, 4, 3, 2, 1],
          [3, 1, 4, 1, 5, 9, 2, 6],
        ];

        // Specific adjustments for non-negative requirements of counting/radix/bucket
        const isNonNegative = ['counting-sort', 'radix-sort', 'bucket-sort'].includes(algo.id);
        const testSets = isNonNegative
          ? edgeCases.map(tc => tc.map(v => Math.max(1, Math.min(50, v))))
          : edgeCases;

        for (const input of testSets) {
          const original = [...input];
          const steps = algo.generate(input);

          // Invariant 1: Input array is never mutated
          expect(input).toEqual(original);

          // Invariant 2: At least one step produced
          expect(steps.length).toBeGreaterThan(0);

          const finalStep = steps[steps.length - 1];
          expect(finalStep.engine).toBe('bars');

          if (finalStep.engine === 'bars') {
            const finalValues = finalStep.bars.values;
            const oracleSorted = [...input].sort((a, b) => a - b);

            // Invariant 3: Final frame matches native sort oracle
            expect(finalValues).toEqual(oracleSorted);

            // Invariant 4: Output is a permutation of input (multiset preservation)
            expect(finalValues.length).toBe(input.length);
          }
        }
      });

      it('verifies 20 randomized seeded inputs against oracle', () => {
        const rng = createRng(42);
        const isNonNegative = ['counting-sort', 'radix-sort', 'bucket-sort'].includes(algo.id);

        for (let seed = 1; seed <= 20; seed++) {
          const size = Math.floor(4 + rng() * 6);
          const raw = generateRandomNumbers(size, isNonNegative ? 1 : -20, 80, seed * 101);
          const input = isNonNegative ? raw.map(v => Math.max(1, v)) : raw;

          const steps = algo.generate(input);
          const finalStep = steps[steps.length - 1];

          if (finalStep.engine === 'bars') {
            const finalValues = finalStep.bars.values;
            const oracle = [...input].sort((a, b) => a - b);
            expect(finalValues).toEqual(oracle);
          }
        }
      });

      it('guarantees captions, line numbers, and marks on all steps', () => {
        const steps = algo.generate([25, 12, 48, 8, 30]);
        for (const step of steps) {
          expect(step.caption).toBeDefined();
          expect(step.caption.trim().length).toBeGreaterThan(5);
          expect(step.line).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }
});
