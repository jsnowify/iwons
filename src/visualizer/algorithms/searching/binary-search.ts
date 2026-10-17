/**
 * Binary Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const binarySearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'binary-search',
  name: 'Binary Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Repeatedly divides the search interval in half. Compares the target value to the middle element, discarding half the remaining candidates on each step.',
  pseudocode: [
    'procedure binarySearch(A, target):',
    '  low := 0',
    '  high := length(A) - 1',
    '  while low <= high do:',
    '    mid := floor((low + high) / 2)',
    '    if A[mid] = target then:',
    '      return mid  // target found',
    '    else if A[mid] < target then:',
    '      low := mid + 1',
    '    else:',
    '      high := mid - 1',
    '  return -1  // target not found',
  ],
  presets: [
    {
      name: 'found-middle',
      label: 'Target in Array (Find 29)',
      description: 'Standard search where target exists.',
      input: { target: 29, numbers: [3, 8, 14, 22, 29, 41, 56, 72] },
    },
    {
      name: 'found-first-step',
      label: 'Best Case (Find 22 at Mid)',
      description: 'Target located on the very first comparison.',
      input: { target: 22, numbers: [4, 9, 15, 22, 38, 50, 65] },
    },
    {
      name: 'absent-high',
      label: 'Target Absent (Find 80)',
      description: 'Target greater than all elements; interval empties on right.',
      input: { target: 80, numbers: [5, 12, 19, 28, 37, 45, 60] },
    },
    {
      name: 'absent-between',
      label: 'Target Absent (Find 25)',
      description: 'Target between elements; interval shrinks until low > high.',
      input: { target: 25, numbers: [4, 10, 18, 30, 42, 58, 70] },
    },
  ],
  generate(input: TargetAndNumbers): ArrayPointersStep[] {
    const rawArr = [...input.numbers];
    // Binary search requires sorted array; ensure sorted
    const arr = [...rawArr].sort((a, b) => a - b);
    const target = input.target;
    const steps: ArrayPointersStep[] = [];

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
          ranges: pointers.some(p => p.name === 'low') && pointers.some(p => p.name === 'high')
            ? [{
                from: pointers.find(p => p.name === 'low')!.index,
                to: pointers.find(p => p.name === 'high')!.index,
                label: 'active interval',
              }]
            : undefined,
          marks,
          result,
        },
      });
    };

    if (arr.length === 0) {
      record(`Search interval is empty. Target ${target} not found.`, 12, [], {}, { target }, -1);
      return steps;
    }

    let low = 0;
    let high = arr.length - 1;

    record(
      `Initialize search for target ${target} across index 0 to ${high}.`,
      2,
      [
        { name: 'low', index: low, color: 'primary' },
        { name: 'high', index: high, color: 'primary' },
      ],
      {},
      { low, high, target }
    );

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const activeMarks: Record<number, ArrayCellMark> = {};
      for (let i = 0; i < arr.length; i++) {
        if (i < low || i > high) activeMarks[i] = 'eliminated';
      }
      activeMarks[mid] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'low', index: low, color: 'primary' },
        { name: 'mid', index: mid, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ];

      record(
        `Compute mid = floor((${low} + ${high}) / 2) = ${mid}. Inspect A[${mid}] = ${arr[mid]}.`,
        5,
        pointers,
        activeMarks,
        { low, mid, high, 'A[mid]': arr[mid], target }
      );

      if (arr[mid] === target) {
        const foundMarks: Record<number, ArrayCellMark> = { ...activeMarks, [mid]: 'found' };
        record(
          `Match found! A[${mid}] = ${target} at index ${mid}.`,
          7,
          [{ name: 'mid', index: mid, color: 'accent' }],
          foundMarks,
          { mid, result: mid },
          mid
        );
        return steps;
      }

      if (arr[mid] < target) {
        record(
          `${arr[mid]} < ${target}. Target must be in the right half. Update low := ${mid + 1}.`,
          9,
          pointers,
          activeMarks,
          { low, mid, high, 'A[mid]': arr[mid], target }
        );
        low = mid + 1;
      } else {
        record(
          `${arr[mid]} > ${target}. Target must be in the left half. Update high := ${mid - 1}.`,
          11,
          pointers,
          activeMarks,
          { low, mid, high, 'A[mid]': arr[mid], target }
        );
        high = mid - 1;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let i = 0; i < arr.length; i++) allEliminated[i] = 'eliminated';

    record(
      `Interval exhausted (low=${low} > high=${high}). Target ${target} is not in the array.`,
      12,
      [],
      allEliminated,
      { low, high, target, result: -1 },
      -1
    );

    return steps;
  },
};

export default binarySearchDefinition;

