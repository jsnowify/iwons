/**
 * Fast and Slow Pointers (Floyd) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const fastAndSlowPointersDefinition: AlgoDefinition<number[]> = {
  id: 'fast-and-slow-pointers',
  name: 'Fast and Slow Pointers (Floyd)',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Advances two pointers at different speeds (tortoise 1 step, hare 2 steps) across the sequence, finding the exact middle element in a single linear pass.',
  pseudocode: [
    'procedure findMiddle(A):',
    '  slow := 0, fast := 0',
    '  while fast < length(A) - 1 and fast + 1 < length(A) do:',
    '    slow := slow + 1',
    '    fast := fast + 2',
    '  return slow  // index of middle element',
  ],
  presets: [
    {
      name: 'odd-length',
      label: 'Odd Length (7 elements)',
      description: 'Finds the unique center element at index 3.',
      input: [12, 25, 33, 47, 58, 62, 79],
    },
    {
      name: 'even-length',
      label: 'Even Length (8 elements)',
      description: 'Finds the first/second center element at index 4.',
      input: [5, 10, 15, 20, 25, 30, 35, 40],
    },
    {
      name: 'short-array',
      label: 'Short Sequence (3 elements)',
      description: 'Single iteration confirms the middle element.',
      input: [100, 200, 300],
    },
  ],
  generate(input: number[]): ArrayPointersStep[] {
    const arr = [...input];
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
      record('Array is empty. No middle element exists.', 6, [], {}, undefined, null);
      return steps;
    }

    if (n === 1) {
      record(
        `Array contains single element [${arr[0]}], which is the middle.`,
        6,
        [{ name: 'slow', index: 0, color: 'accent' }],
        { 0: 'found' },
        { middleIndex: 0, val: arr[0] },
        0
      );
      return steps;
    }

    let slow = 0;
    let fast = 0;

    record(
      `Initialize Tortoise and Hare pointers at start index 0.`,
      2,
      [
        { name: 'slow (1x)', index: slow, color: 'primary' },
        { name: 'fast (2x)', index: fast, color: 'accent' },
      ],
      { 0: 'checking' },
      { slow, fast, n }
    );

    let stepCount = 0;
    while (fast < n - 1 && fast + 1 < n) {
      stepCount++;
      slow += 1;
      fast += 2;

      const marks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < slow; k++) marks[k] = 'window';
      marks[slow] = 'checking';
      if (fast < n) marks[fast] = 'match';

      const pointers: ArrayPointer[] = [
        { name: 'slow (1x)', index: slow, color: 'primary' },
      ];
      if (fast < n) {
        pointers.push({ name: 'fast (2x)', index: fast, color: 'accent' });
      }

      record(
        `Step ${stepCount}: slow advances 1 to index ${slow} (val=${arr[slow]}), fast advances 2 to index ${Math.min(fast, n - 1)}.`,
        4,
        pointers,
        marks,
        { step: stepCount, slow, fast: Math.min(fast, n - 1), 'A[slow]': arr[slow] }
      );
    }

    const finalMarks: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) finalMarks[k] = 'window';
    finalMarks[slow] = 'found';

    record(
      `Hare reached the end (fast=${Math.min(fast, n - 1)} >= ${n - 1}). Tortoise marks exact middle at index ${slow} (val=${arr[slow]}).`,
      6,
      [{ name: 'mid', index: slow, color: 'accent' }],
      finalMarks,
      { middleIndex: slow, middleValue: arr[slow], result: slow },
      slow
    );

    return steps;
  },
};

export default fastAndSlowPointersDefinition;
