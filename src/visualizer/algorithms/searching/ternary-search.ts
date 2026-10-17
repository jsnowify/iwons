/**
 * Ternary Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const ternarySearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'ternary-search',
  name: 'Ternary Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(log₃ n)',
    worst: 'O(log₃ n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Divides the sorted search space into three equal segments using two midpoints (mid1 and mid2), eliminating two-thirds of the remaining elements when outside or one-third when inside.',
  pseudocode: [
    'procedure ternarySearch(A, target):',
    '  low := 0, high := length(A) - 1',
    '  while low <= high do:',
    '    mid1 := low + floor((high - low) / 3)',
    '    mid2 := high - floor((high - low) / 3)',
    '    if A[mid1] = target return mid1',
    '    if A[mid2] = target return mid2',
    '    if target < A[mid1] then high := mid1 - 1',
    '    else if target > A[mid2] then low := mid2 + 1',
    '    else low := mid1 + 1, high := mid2 - 1',
    '  return -1',
  ],
  presets: [
    {
      name: 'found-first-third',
      label: 'Target in First Third (Find 18)',
      description: 'Matches mid1 or falls in leftmost partition.',
      input: { target: 18, numbers: [4, 9, 14, 18, 25, 33, 42, 55, 68, 77, 89] },
    },
    {
      name: 'found-middle-third',
      label: 'Target in Middle Third (Find 42)',
      description: 'Target bounded between mid1 and mid2.',
      input: { target: 42, numbers: [5, 12, 20, 29, 36, 42, 51, 62, 73, 85, 94] },
    },
    {
      name: 'absent-ternary',
      label: 'Target Absent (Find 50)',
      description: 'Tri-partition shrinks interval until low > high.',
      input: { target: 50, numbers: [3, 11, 19, 27, 38, 46, 58, 69, 81, 92] },
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
      record(`Array is empty. Target ${target} not found.`, 11, [], {}, undefined, { target }, -1);
      return steps;
    }

    let low = 0;
    let high = n - 1;

    record(
      `Initialize Ternary Search for target ${target} across range [0..${high}].`,
      1,
      [
        { name: 'low', index: low, color: 'primary' },
        { name: 'high', index: high, color: 'primary' },
      ],
      {},
      { from: low, to: high, label: 'Search interval' },
      { low, high, target }
    );

    while (low <= high) {
      const mid1 = low + Math.floor((high - low) / 3);
      const mid2 = high - Math.floor((high - low) / 3);

      const activeMarks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < n; k++) {
        if (k < low || k > high) activeMarks[k] = 'eliminated';
      }
      activeMarks[mid1] = 'checking';
      activeMarks[mid2] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'low', index: low, color: 'primary' },
        { name: 'mid1', index: mid1, color: 'accent' },
        { name: 'mid2', index: mid2, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ];

      record(
        `Compute midpoints: mid1=${mid1} (A[${mid1}]=${arr[mid1]}), mid2=${mid2} (A[${mid2}]=${arr[mid2]}). Compare with target ${target}.`,
        4,
        pointers,
        activeMarks,
        { from: low, to: high, label: '3-way split' },
        { low, mid1, mid2, high, 'A[mid1]': arr[mid1], 'A[mid2]': arr[mid2], target }
      );

      if (arr[mid1] === target) {
        activeMarks[mid1] = 'found';
        record(
          `Target found at mid1! A[${mid1}] equals ${target}. Return index ${mid1}.`,
          6,
          [{ name: 'found', index: mid1, color: 'accent' }],
          activeMarks,
          undefined,
          { mid1, target, result: mid1 },
          mid1
        );
        return steps;
      }

      if (arr[mid2] === target) {
        activeMarks[mid2] = 'found';
        record(
          `Target found at mid2! A[${mid2}] equals ${target}. Return index ${mid2}.`,
          7,
          [{ name: 'found', index: mid2, color: 'accent' }],
          activeMarks,
          undefined,
          { mid2, target, result: mid2 },
          mid2
        );
        return steps;
      }

      if (target < arr[mid1]) {
        record(
          `Target ${target} < A[mid1] (${arr[mid1]}). Target lies in first third. Update high := ${mid1 - 1}.`,
          8,
          pointers,
          activeMarks,
          undefined,
          { low, high: mid1 - 1, target }
        );
        high = mid1 - 1;
      } else if (target > arr[mid2]) {
        record(
          `Target ${target} > A[mid2] (${arr[mid2]}). Target lies in last third. Update low := ${mid2 + 1}.`,
          9,
          pointers,
          activeMarks,
          undefined,
          { low: mid2 + 1, high, target }
        );
        low = mid2 + 1;
      } else {
        record(
          `A[mid1] < ${target} < A[mid2]. Target lies in middle third. Update low := ${mid1 + 1}, high := ${mid2 - 1}.`,
          10,
          pointers,
          activeMarks,
          undefined,
          { low: mid1 + 1, high: mid2 - 1, target }
        );
        low = mid1 + 1;
        high = mid2 - 1;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `Interval exhausted (low=${low} > high=${high}). Target ${target} not in array. Return -1.`,
      11,
      [],
      allEliminated,
      undefined,
      { target, result: -1 },
      -1
    );

    return steps;
  },
};

export default ternarySearchDefinition;

