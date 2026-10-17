/**
 * Dutch National Flag (3-way Partition) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const dutchNationalFlagDefinition: AlgoDefinition<number[]> = {
  id: 'dutch-national-flag',
  name: 'Dutch National Flag (3-way Partition)',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Partitions an array containing three distinct values (0s, 1s, and 2s) into sorted order in a single pass using three pointers (low, mid, and high).',
  pseudocode: [
    'procedure dutchNationalFlag(A):',
    '  low := 0, mid := 0, high := length(A) - 1',
    '  while mid <= high do:',
    '    if A[mid] = 0 then:',
    '      swap(A[low], A[mid])',
    '      low := low + 1, mid := mid + 1',
    '    else if A[mid] = 1 then:',
    '      mid := mid + 1',
    '    else: // A[mid] = 2',
    '      swap(A[mid], A[high])',
    '      high := high - 1',
  ],
  presets: [
    {
      name: 'random-triplet',
      label: 'Random 0s, 1s, and 2s (9 elements)',
      description: 'Mixed sequence demonstrating all three pointer branches.',
      input: [2, 0, 2, 1, 1, 0, 2, 1, 0],
    },
    {
      name: 'all-twos-first',
      label: 'Inverted Order (2s then 1s then 0s)',
      description: 'Stress-tests high pointer swaps and partition boundaries.',
      input: [2, 2, 1, 1, 0, 0],
    },
    {
      name: 'already-partitioned',
      label: 'Already Partitioned',
      description: 'Only mid pointer advances with zero swaps required.',
      input: [0, 0, 1, 1, 2, 2],
    },
  ],
  generate(input: number[]): ArrayPointersStep[] {
    const rawArr = [...input];
    const arr = rawArr.map(v => Math.max(0, Math.min(2, Math.abs(Math.round(v)) % 3)));
    const steps: ArrayPointersStep[] = [];
    const n = arr.length;

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      marks?: Record<number, ArrayCellMark>,
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
          marks,
          result,
        },
      });
    };

    if (n === 0) {
      record('Array is empty. Already partitioned.', 11, [], {}, undefined, null);
      return steps;
    }

    let low = 0;
    let mid = 0;
    let high = n - 1;

    record(
      `Initialize Dutch National Flag pointers: low=0, mid=0, high=${high}.`,
      2,
      [
        { name: 'low', index: low, color: 'primary' },
        { name: 'mid', index: mid, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ],
      { 0: 'checking' },
      { low, mid, high }
    );

    while (mid <= high) {
      const val = arr[mid];
      const marks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < low; k++) marks[k] = 'window';
      for (let k = high + 1; k < n; k++) marks[k] = 'found';
      marks[mid] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'low', index: low, color: 'primary' },
        { name: 'mid', index: mid, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ];

      if (val === 0) {
        marks[low] = 'match';
        marks[mid] = 'checking';
        const temp = arr[low];
        arr[low] = arr[mid];
        arr[mid] = temp;

        record(
          `A[mid]=0: swap with A[low] (indices ${low} and ${mid}). Advance low to ${low + 1} and mid to ${mid + 1}.`,
          5,
          pointers,
          marks,
          { low, mid, high, val, swapped: `(${low}, ${mid})` }
        );

        low++;
        mid++;
      } else if (val === 1) {
        record(
          `A[mid]=1: element is in middle partition. Advance mid to ${mid + 1}.`,
          8,
          pointers,
          marks,
          { low, mid, high, val }
        );
        mid++;
      } else {
        // val === 2
        marks[mid] = 'checking';
        marks[high] = 'match';
        const temp = arr[mid];
        arr[mid] = arr[high];
        arr[high] = temp;

        record(
          `A[mid]=2: swap with A[high] (indices ${mid} and ${high}). Decrement high to ${high - 1}. Keep mid at ${mid} to inspect swapped element.`,
          11,
          pointers,
          marks,
          { low, mid, high, val, swapped: `(${mid}, ${high})` }
        );

        high--;
      }
    }

    const finalMarks: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) finalMarks[k] = 'found';

    record(
      `Dutch National Flag complete. Array partitioned into 0s, 1s, and 2s: [${arr.join(', ')}].`,
      12,
      [],
      finalMarks,
      { status: 'Partitioned', final: arr.join(', ') },
      arr.join(', ')
    );

    return steps;
  },
};

export default dutchNationalFlagDefinition;
