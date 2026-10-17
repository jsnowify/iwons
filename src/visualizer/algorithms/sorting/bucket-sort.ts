/**
 * Bucket Sort - Engine 1 (Bars with Auxiliary Bucket Summary)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';

export const bucketSortDefinition: AlgoDefinition<number[]> = {
  id: 'bucket-sort',
  name: 'Bucket Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n + k)',
    average: 'O(n + k)',
    worst: 'O(n²)',
    space: 'O(n + k)',
  },
  inputKind: 'numbers',
  blurb: 'Distributes elements into a fixed number of buckets according to their value intervals, sorts each individual bucket with insertion sort, and concatenates the buckets into the final sorted output.',
  pseudocode: [
    'procedure bucketSort(A, k):',
    '  create k empty buckets',
    '  find min and max to determine interval',
    '  for each x in A do:',
    '    bucketIdx := floor((x - min) / interval)',
    '    insert x into bucket[bucketIdx]',
    '  sort each non-empty bucket with insertion sort',
    '  concatenate buckets back into A',
  ],
  presets: [
    {
      name: 'uniform-random',
      label: 'Uniformly Distributed (8 elements)',
      description: 'Elements spread fairly evenly across value intervals.',
      input: [78, 17, 39, 26, 72, 94, 21, 12],
    },
    {
      name: 'clustered',
      label: 'Clustered in Low Buckets',
      description: 'Multiple elements falling into identical buckets.',
      input: [12, 19, 14, 82, 15, 88, 18, 91],
    },
    {
      name: 'reversed',
      label: 'Reversed Values',
      description: 'Inverted array demonstrating bucket placement.',
      input: [85, 68, 54, 42, 31, 20, 9],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const raw = [...input];
    const arr = raw.map(v => Math.max(1, Math.min(100, Math.round(Math.abs(v)))));
    const steps: BarsStep[] = [];

    if (arr.length <= 1) {
      steps.push({
        engine: 'bars',
        caption: arr.length === 0 ? 'Array is empty.' : `Single element [${arr[0]}] is sorted.`,
        line: 1,
        bars: { values: [...arr], marks: arr.length === 1 ? { 0: 'sorted' } : undefined },
      });
      return steps;
    }

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const numBuckets = 5;
    const interval = Math.max(1, Math.ceil((max - min + 1) / numBuckets));
    const buckets: number[][] = Array.from({ length: numBuckets }, () => []);

    const record = (
      caption: string,
      line: number,
      marks?: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'>,
      vars?: Record<string, string | number | boolean>
    ) => {
      steps.push({
        engine: 'bars',
        caption,
        line,
        vars,
        bars: {
          values: [...arr],
          marks: marks ? { ...marks } : undefined,
          auxiliary: {
            label: `Buckets 0..4 (Counts: [${buckets.map(b => b.length).join(', ')}])`,
            values: buckets.map(b => (b.length > 0 ? b[0] : null)),
          },
        },
      });
    };

    record(
      `Allocate ${numBuckets} buckets for range [${min}..${max}]. Interval per bucket is ~${interval}.`,
      3,
      undefined,
      { min, max, numBuckets, interval }
    );

    // Scatter phase: distribute elements into buckets
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      const bIdx = Math.min(numBuckets - 1, Math.floor((val - min) / interval));
      buckets[bIdx].push(val);

      record(
        `Scatter: Place A[${i}]=${val} into Bucket ${bIdx}. Bucket now contains [${buckets[bIdx].join(', ')}].`,
        6,
        { [i]: 'selected' },
        { i, val, bucketIdx: bIdx, bucketSize: buckets[bIdx].length }
      );
    }

    record('Distribution into buckets complete. Phase 2: Sort each bucket and gather back.', 7);

    // Sort each bucket and gather
    let writeIdx = 0;
    const sortedIndices = new Set<number>();

    for (let b = 0; b < numBuckets; b++) {
      if (buckets[b].length === 0) continue;
      buckets[b].sort((x, y) => x - y);

      for (const val of buckets[b]) {
        arr[writeIdx] = val;
        sortedIndices.add(writeIdx);

        const gatherMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
        for (const idx of sortedIndices) gatherMarks[idx] = 'sorted';
        gatherMarks[writeIdx] = 'swapped';

        record(
          `Gather: Write sorted element ${val} from Bucket ${b} into index ${writeIdx}.`,
          8,
          gatherMarks,
          { bucket: b, val, writeIdx }
        );

        writeIdx++;
      }
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Bucket Sort complete. All buckets concatenated in order.`, 8, finalMarks, { status: 'Sorted' });

    return steps;
  },
};

export default bucketSortDefinition;
