/**
 * Exponential Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const exponentialSearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'exponential-search',
  name: 'Exponential Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Finds the range where the target resides by repeatedly doubling powers of 2 (1, 2, 4, 8, ...), then performs a bounded binary search within that specific range.',
  pseudocode: [
    'procedure exponentialSearch(A, target):',
    '  n := length(A)',
    '  if n = 0 return -1',
    '  if A[0] = target return 0',
    '  i := 1',
    '  while i < n and A[i] <= target do:',
    '    i := i * 2',
    '  return binarySearch(A, i / 2, min(i, n - 1), target)',
  ],
  presets: [
    {
      name: 'found-doubling',
      label: 'Found after Doubling (Find 48)',
      description: 'Doubles index 1 -> 2 -> 4 -> 8, then binary searches.',
      input: { target: 48, numbers: [3, 7, 12, 19, 28, 35, 48, 59, 71, 85, 96] },
    },
    {
      name: 'found-first-index',
      label: 'Target at Index 0 (Find 5)',
      description: 'Best case: matches at index 0 immediately.',
      input: { target: 5, numbers: [5, 12, 22, 33, 45, 60, 77] },
    },
    {
      name: 'absent-overshoot',
      label: 'Target Absent (Find 50)',
      description: 'Bounds range [4..8], then binary search confirms absent.',
      input: { target: 50, numbers: [2, 6, 14, 21, 33, 44, 55, 68, 80] },
    },
  ],
  generate(input: TargetAndNumbers): ArrayPointersStep[] {
    const rawArr = [...input.numbers];
    const arr = [...rawArr].sort((a, b) => a - b);
    const target = input.target;
    const steps: ArrayPointersStep[] = [];
    const n = arr.length;

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      marks?: Record<number, ArrayCellMark>,
      range?: { from: number; to: number; label?: string },
      vars?: Record<string, string | number | boolean>,
      result?: string | number | boolean | null
    ) => {
      steps.push({
        engine: 'array-pointers',
        caption,
        line,
        vars,
        array: {
          values: [...arr],
          pointers,
          ranges: range ? [range] : undefined,
          marks,
          result,
        },
      });
    };

    if (n === 0) {
      record(`Array is empty. Target ${target} not found.`, 3, [], {}, undefined, { target }, -1);
      return steps;
    }

    record(
      `Check initial element at index 0 for target ${target}.`,
      4,
      [{ name: 'i', index: 0, color: 'accent' }],
      { 0: 'checking' },
      undefined,
      { 'A[0]': arr[0], target }
    );

    if (arr[0] === target) {
      record(
        `Target matches at index 0! Return 0.`,
        4,
        [{ name: 'found', index: 0, color: 'accent' }],
        { 0: 'found' },
        undefined,
        { target, result: 0 },
        0
      );
      return steps;
    }

    let i = 1;
    while (i < n && arr[i] <= target) {
      const doublingMarks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < i; k++) doublingMarks[k] = 'window';
      doublingMarks[i] = 'checking';

      record(
        `Exponential doubling probe: index i=${i}, A[${i}]=${arr[i]} <= ${target}. Double range i := ${i * 2}.`,
        6,
        [{ name: 'i', index: i, color: 'accent' }],
        doublingMarks,
        { from: 0, to: i, label: `Doubling reach: 2^k` },
        { i, 'A[i]': arr[i], target, next_i: i * 2 }
      );

      i *= 2;
    }

    const lowBound = Math.floor(i / 2);
    const highBound = Math.min(i, n - 1);

    record(
      `Range bounded: target ${target} must reside in subrange [${lowBound}..${highBound}]. Starting binary search.`,
      8,
      [
        { name: 'low', index: lowBound, color: 'primary' },
        { name: 'high', index: highBound, color: 'primary' },
      ],
      {},
      { from: lowBound, to: highBound, label: 'Bounded range' },
      { low: lowBound, high: highBound, target }
    );

    // Bounded binary search
    let low = lowBound;
    let high = highBound;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const activeMarks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < n; k++) {
        if (k < low || k > high) activeMarks[k] = 'eliminated';
      }
      activeMarks[mid] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'low', index: low, color: 'primary' },
        { name: 'mid', index: mid, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ];

      record(
        `Binary search mid = ${mid}, A[${mid}] = ${arr[mid]}. Compare with target ${target}.`,
        8,
        pointers,
        activeMarks,
        { from: low, to: high, label: 'Active subrange' },
        { low, mid, high, 'A[mid]': arr[mid], target }
      );

      if (arr[mid] === target) {
        activeMarks[mid] = 'found';
        record(
          `Target found! A[${mid}] equals ${target}. Return index ${mid}.`,
          8,
          [{ name: 'found', index: mid, color: 'accent' }],
          activeMarks,
          undefined,
          { mid, target, result: mid },
          mid
        );
        return steps;
      }

      if (arr[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `Subrange exhausted without finding target ${target}. Return -1.`,
      8,
      [],
      allEliminated,
      undefined,
      { target, result: -1 },
      -1
    );

    return steps;
  },
};

export default exponentialSearchDefinition;
