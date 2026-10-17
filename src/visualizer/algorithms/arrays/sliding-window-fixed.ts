/**
 * Sliding Window (Fixed Size) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const slidingWindowFixedDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'sliding-window-fixed',
  name: 'Sliding Window (Fixed Size)',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Computes the maximum sum of any contiguous subarray of fixed size k by sliding an interval across the array, adding the incoming element and subtracting the outgoing element in O(1) per step.',
  pseudocode: [
    'procedure maxSubarraySumFixed(A, k):',
    '  windowSum := sum(A[0..k-1])',
    '  maxSum := windowSum',
    '  for i := k to length(A) - 1 do:',
    '    windowSum := windowSum + A[i] - A[i - k]',
    '    maxSum := max(maxSum, windowSum)',
    '  return maxSum',
  ],
  presets: [
    {
      name: 'window-size-3',
      label: 'Window k=3 (8 elements)',
      description: 'Standard fixed window sliding across positive and negative numbers.',
      input: { target: 3, numbers: [2, 1, 5, 1, 3, 2, 8, 4] },
    },
    {
      name: 'window-size-2',
      label: 'Window k=2 (Find Peak Pair)',
      description: 'Finds adjacent pair with highest combined sum.',
      input: { target: 2, numbers: [4, 7, 2, 9, 1, 8, 3] },
    },
    {
      name: 'window-size-4',
      label: 'Window k=4 (Large Subarray)',
      description: 'Wider span demonstrating boundary shifts.',
      input: { target: 4, numbers: [1, 4, 2, 10, 23, 3, 1, 0, 20] },
    },
  ],
  generate(input: TargetAndNumbers): ArrayPointersStep[] {
    const arr = [...input.numbers];
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
      record('Array is empty. Maximum sum is 0.', 7, [], {}, undefined, { maxSum: 0 }, 0);
      return steps;
    }

    const rawK = Math.round(Number(input.target) || 3);
    const k = Math.max(1, Math.min(n, rawK));

    // Initial window
    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += arr[i];
    let maxSum = windowSum;
    let bestStart = 0;

    const initialMarks: Record<number, ArrayCellMark> = {};
    for (let i = 0; i < k; i++) initialMarks[i] = 'window';

    record(
      `Initialize sliding window of fixed size k=${k}. Initial sum for A[0..${k - 1}] is ${windowSum}.`,
      2,
      [
        { name: 'L', index: 0, color: 'primary' },
        { name: 'R', index: k - 1, color: 'accent' },
      ],
      initialMarks,
      { from: 0, to: k - 1, label: `Window sum: ${windowSum}` },
      { k, windowSum, maxSum, bestRange: `[0..${k - 1}]` }
    );

    // Slide window
    for (let i = k; i < n; i++) {
      const outgoing = arr[i - k];
      const incoming = arr[i];
      windowSum = windowSum + incoming - outgoing;
      const leftIdx = i - k + 1;

      const marks: Record<number, ArrayCellMark> = {};
      for (let idx = leftIdx; idx <= i; idx++) marks[idx] = 'window';
      marks[i - k] = 'eliminated';
      marks[i] = 'checking';

      const isNewMax = windowSum > maxSum;
      if (isNewMax) {
        maxSum = windowSum;
        bestStart = leftIdx;
      }

      record(
        `Slide window to [${leftIdx}..${i}]: subtract outgoing A[${i - k}]=${outgoing}, add incoming A[${i}]=${incoming}. New sum = ${windowSum}.${isNewMax ? ' New maximum found!' : ''}`,
        5,
        [
          { name: 'L', index: leftIdx, color: 'primary' },
          { name: 'R', index: i, color: 'accent' },
        ],
        marks,
        { from: leftIdx, to: i, label: `Sum: ${windowSum}` },
        {
          left: leftIdx,
          right: i,
          outgoing,
          incoming,
          windowSum,
          maxSum,
          bestRange: `[${bestStart}..${bestStart + k - 1}]`,
        }
      );
    }

    const finalMarks: Record<number, ArrayCellMark> = {};
    for (let idx = bestStart; idx < bestStart + k; idx++) finalMarks[idx] = 'found';

    record(
      `Sliding Window complete. Maximum subarray sum for window size k=${k} is ${maxSum} (span [${bestStart}..${bestStart + k - 1}]).`,
      7,
      [
        { name: 'max_L', index: bestStart, color: 'accent' },
        { name: 'max_R', index: bestStart + k - 1, color: 'accent' },
      ],
      finalMarks,
      { from: bestStart, to: bestStart + k - 1, label: `Max Sum: ${maxSum}` },
      { k, maxSum, bestRange: `[${bestStart}..${bestStart + k - 1}]`, result: maxSum },
      maxSum
    );

    return steps;
  },
};

export default slidingWindowFixedDefinition;

