/**
 * Jump Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const jumpSearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'jump-search',
  name: 'Jump Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(√n)',
    worst: 'O(√n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Searches sorted arrays by jumping forward in fixed blocks of √n elements, then performing a backward linear search within the identified block.',
  pseudocode: [
    'procedure jumpSearch(A, target):',
    '  n := length(A)',
    '  step := floor(sqrt(n))',
    '  prev := 0',
    '  while A[min(step, n) - 1] < target do:',
    '    prev := step',
    '    step := step + floor(sqrt(n))',
    '    if prev >= n return -1',
    '  while A[prev] < target do:',
    '    prev := prev + 1',
    '    if prev = min(step, n) return -1',
    '  if A[prev] = target return prev',
    '  return -1',
  ],
  presets: [
    {
      name: 'found-block-2',
      label: 'Target in Block 2 (Find 34)',
      description: 'Jumps block by block, then locates target in linear scan.',
      input: { target: 34, numbers: [2, 5, 8, 12, 16, 23, 34, 45, 56, 67, 78, 89] },
    },
    {
      name: 'found-first-block',
      label: 'Target in First Block (Find 8)',
      description: 'Immediately identifies first block without jumping further.',
      input: { target: 8, numbers: [1, 4, 8, 15, 20, 27, 39, 44, 52] },
    },
    {
      name: 'absent-overshoot',
      label: 'Target Absent (Find 50)',
      description: 'Identifies block boundary, then linear scan proves absent.',
      input: { target: 50, numbers: [3, 9, 14, 22, 31, 42, 60, 75, 90] },
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
      record(`Array is empty. Target ${target} not found.`, 12, [], {}, undefined, { target }, -1);
      return steps;
    }

    const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));
    let step = blockSize;
    let prev = 0;

    record(
      `Initialize Jump Search for target ${target}. Array size n=${n}, block jump size √${n} ≈ ${blockSize}.`,
      2,
      [{ name: 'prev', index: 0, color: 'primary' }],
      {},
      undefined,
      { n, blockSize, target }
    );

    // Jump phase
    while (arr[Math.min(step, n) - 1] < target) {
      const rightIdx = Math.min(step, n) - 1;
      const jumpMarks: Record<number, ArrayCellMark> = {};
      for (let i = 0; i < prev; i++) jumpMarks[i] = 'eliminated';
      jumpMarks[rightIdx] = 'checking';

      record(
        `Block [${prev}..${rightIdx}]: boundary A[${rightIdx}]=${arr[rightIdx]} < ${target}. Jump to next block.`,
        4,
        [
          { name: 'prev', index: prev, color: 'primary' },
          { name: 'step', index: rightIdx, color: 'accent' },
        ],
        jumpMarks,
        { from: prev, to: rightIdx, label: `Jumped over block` },
        { prev, stepBoundary: rightIdx, boundaryVal: arr[rightIdx], target }
      );

      prev = step;
      step += blockSize;

      if (prev >= n) {
        const eliminatedMarks: Record<number, ArrayCellMark> = {};
        for (let i = 0; i < n; i++) eliminatedMarks[i] = 'eliminated';
        record(`Jumped beyond array end (prev=${prev} >= n=${n}). Target ${target} is absent.`, 7, [], eliminatedMarks, undefined, { target }, -1);
        return steps;
      }
    }

    const rightBoundary = Math.min(step, n) - 1;
    const blockMarks: Record<number, ArrayCellMark> = {};
    for (let i = 0; i < prev; i++) blockMarks[i] = 'eliminated';
    for (let i = rightBoundary + 1; i < n; i++) blockMarks[i] = 'eliminated';
    for (let i = prev; i <= rightBoundary; i++) blockMarks[i] = 'window';

    record(
      `Candidate block found: A[${rightBoundary}]=${arr[rightBoundary]} >= ${target}. Searching linearly in range [${prev}..${rightBoundary}].`,
      8,
      [
        { name: 'prev', index: prev, color: 'primary' },
        { name: 'right', index: rightBoundary, color: 'primary' },
      ],
      blockMarks,
      { from: prev, to: rightBoundary, label: 'Candidate block' },
      { prev, rightBoundary, target }
    );

    // Linear search phase
    while (prev <= rightBoundary && arr[prev] < target) {
      blockMarks[prev] = 'eliminated';
      prev++;
      if (prev <= rightBoundary) {
        blockMarks[prev] = 'checking';
        record(
          `Linear check: A[${prev - 1}] < ${target}. Step forward to index ${prev}.`,
          9,
          [{ name: 'scan', index: prev, color: 'accent' }],
          blockMarks,
          { from: prev, to: rightBoundary, label: 'Candidate block' },
          { prev, 'A[prev]': arr[prev], target }
        );
      }
    }

    if (prev <= rightBoundary && arr[prev] === target) {
      blockMarks[prev] = 'found';
      record(
        `Match found! A[${prev}] = ${target} at index ${prev}.`,
        11,
        [{ name: 'found', index: prev, color: 'accent' }],
        blockMarks,
        undefined,
        { index: prev, target, result: prev },
        prev
      );
      return steps;
    }

    record(
      `Exhausted candidate block without match. Target ${target} not in array.`,
      12,
      [],
      blockMarks,
      undefined,
      { target, result: -1 },
      -1
    );

    return steps;
  },
};

export default jumpSearchDefinition;

