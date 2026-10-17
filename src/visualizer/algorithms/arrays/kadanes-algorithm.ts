/**
 * Kadane's Algorithm - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const kadanesAlgorithmDefinition: AlgoDefinition<number[]> = {
  id: 'kadanes-algorithm',
  name: "Kadane's Algorithm",
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Finds the contiguous subarray within a one-dimensional numeric array that has the largest sum, deciding at each element whether to extend the existing subarray or start a new subarray.',
  pseudocode: [
    'procedure kadane(A):',
    '  currentSum := A[0], maxSum := A[0]',
    '  for i := 1 to length(A) - 1 do:',
    '    currentSum := max(A[i], currentSum + A[i])',
    '    maxSum := max(maxSum, currentSum)',
    '  return maxSum',
  ],
  presets: [
    {
      name: 'classic-mixed',
      label: 'Classic Mixed Array (Max 7)',
      description: 'Standard textbook example with positive and negative values.',
      input: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    },
    {
      name: 'all-negative',
      label: 'All Negatives (Max -1)',
      description: 'Single least-negative element is the optimal subarray.',
      input: [-8, -3, -6, -2, -5, -4],
    },
    {
      name: 'growing-positive',
      label: 'Alternating Runs',
      description: 'Multiple peaks testing restart vs extend decisions.',
      input: [3, -1, 2, 5, -6, 4, 7, -2],
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
      record('Array is empty. Maximum subarray sum is 0.', 6, [], {}, undefined, { maxSum: 0 }, 0);
      return steps;
    }

    let currentSum = arr[0];
    let maxSum = arr[0];
    let currentStart = 0;
    let bestStart = 0;
    let bestEnd = 0;

    record(
      `Initialize Kadane: start at index 0. currentSum = A[0] = ${arr[0]}, maxSum = ${maxSum}.`,
      2,
      [{ name: 'i', index: 0, color: 'accent' }],
      { 0: 'found' },
      { from: 0, to: 0, label: `Sum: ${currentSum}` },
      { i: 0, 'A[0]': arr[0], currentSum, maxSum }
    );

    for (let i = 1; i < n; i++) {
      const val = arr[i];
      const extendSum = currentSum + val;

      let decision: string;
      if (val > extendSum) {
        currentSum = val;
        currentStart = i;
        decision = `Restart new subarray at index ${i} because A[${i}]=${val} > extendSum (${extendSum}).`;
      } else {
        currentSum = extendSum;
        decision = `Extend existing subarray by adding A[${i}]=${val}. New currentSum = ${currentSum}.`;
      }

      let isNewMax = false;
      if (currentSum > maxSum) {
        maxSum = currentSum;
        bestStart = currentStart;
        bestEnd = i;
        isNewMax = true;
      }

      const activeMarks: Record<number, ArrayCellMark> = {};
      for (let k = currentStart; k <= i; k++) activeMarks[k] = 'window';
      activeMarks[i] = isNewMax ? 'found' : 'checking';

      record(
        `Step ${i}: Inspect A[${i}] = ${val}. ${decision}${isNewMax ? ` New global maximum ${maxSum} found!` : ''}`,
        4,
        [
          { name: 'curr_start', index: currentStart, color: 'primary' },
          { name: 'i', index: i, color: 'accent' },
        ],
        activeMarks,
        { from: currentStart, to: i, label: `Current sum: ${currentSum}` },
        {
          i,
          'A[i]': val,
          currentSum,
          maxSum,
          bestSubarray: `[${bestStart}..${bestEnd}]`,
        }
      );
    }

    const finalMarks: Record<number, ArrayCellMark> = {};
    for (let k = bestStart; k <= bestEnd; k++) finalMarks[k] = 'found';

    record(
      `Kadane's algorithm complete. Maximum contiguous subarray sum is ${maxSum} spanning indices [${bestStart}..${bestEnd}] (values: [${arr.slice(bestStart, bestEnd + 1).join(', ')}]).`,
      6,
      [
        { name: 'max_L', index: bestStart, color: 'accent' },
        { name: 'max_R', index: bestEnd, color: 'accent' },
      ],
      finalMarks,
      { from: bestStart, to: bestEnd, label: `Max Sum: ${maxSum}` },
      { maxSum, bestStart, bestEnd, result: maxSum },
      maxSum
    );

    return steps;
  },
};

export default kadanesAlgorithmDefinition;

