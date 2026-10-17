/**
 * Sliding Window (Variable Size) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const slidingWindowVariableDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'sliding-window-variable',
  name: 'Sliding Window (Variable Size)',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Dynamically expands the right boundary to satisfy a target condition (sum ≥ S) and contracts the left boundary to find the minimum length contiguous subarray.',
  pseudocode: [
    'procedure minSubArrayLen(A, target):',
    '  left := 0, currentSum := 0, minLen := infinity',
    '  for right := 0 to length(A) - 1 do:',
    '    currentSum := currentSum + A[right]',
    '    while currentSum >= target do:',
    '      minLen := min(minLen, right - left + 1)',
    '      currentSum := currentSum - A[left]',
    '      left := left + 1',
    '  return minLen',
  ],
  presets: [
    {
      name: 'target-7',
      label: 'Target Sum ≥ 7 (Length 2)',
      description: 'Subarray [4, 3] at indices [3..4] reaches sum 7 with minimal length 2.',
      input: { target: 7, numbers: [2, 3, 1, 2, 4, 3] },
    },
    {
      name: 'target-11',
      label: 'Target Sum ≥ 11 (8 elements)',
      description: 'Expands across several items before contracting to minimal span.',
      input: { target: 11, numbers: [1, 2, 3, 4, 5, 2, 6, 1] },
    },
    {
      name: 'target-unreachable',
      label: 'Target Unreachable (Sum 100)',
      description: 'Array sum is less than target; window spans entire array and returns 0.',
      input: { target: 100, numbers: [5, 10, 15, 20] },
    },
  ],
  generate(input: TargetAndNumbers): ArrayPointersStep[] {
    const rawArr = [...input.numbers];
    const arr = rawArr.map(v => Math.max(1, Math.round(v))); // positive numbers for monotonic sum
    const target = Math.max(1, Math.round(Number(input.target) || 7));
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
      record('Array is empty. Minimum subarray length is 0.', 8, [], {}, undefined, { minLen: 0 }, 0);
      return steps;
    }

    let left = 0;
    let currentSum = 0;
    let minLen = Infinity;
    let bestLeft = -1;
    let bestRight = -1;

    record(
      `Initialize variable sliding window for target sum ≥ ${target}.`,
      2,
      [
        { name: 'L', index: 0, color: 'primary' },
        { name: 'R', index: 0, color: 'accent' },
      ],
      {},
      undefined,
      { target, minLen: 'infinity' }
    );

    for (let right = 0; right < n; right++) {
      currentSum += arr[right];

      const expandMarks: Record<number, ArrayCellMark> = {};
      for (let k = left; k <= right; k++) expandMarks[k] = 'window';
      expandMarks[right] = 'checking';

      record(
        `Expand right to index ${right} (added ${arr[right]}). Running window sum = ${currentSum}. Target is ${target}.`,
        4,
        [
          { name: 'L', index: left, color: 'primary' },
          { name: 'R', index: right, color: 'accent' },
        ],
        expandMarks,
        { from: left, to: right, label: `Sum: ${currentSum}` },
        { left, right, currentSum, target, minLen: minLen === Infinity ? 'infinity' : minLen }
      );

      while (currentSum >= target && left <= right) {
        const spanLen = right - left + 1;
        if (spanLen < minLen) {
          minLen = spanLen;
          bestLeft = left;
          bestRight = right;
        }

        const validMarks: Record<number, ArrayCellMark> = {};
        for (let k = left; k <= right; k++) validMarks[k] = 'found';

        record(
          `Constraint met: sum ${currentSum} >= ${target}! Subarray length is ${spanLen} (indices [${left}..${right}]). Current minimum length = ${minLen}. Contract left to check for smaller valid window.`,
          6,
          [
            { name: 'L', index: left, color: 'primary' },
            { name: 'R', index: right, color: 'accent' },
          ],
          validMarks,
          { from: left, to: right, label: `Valid: sum ${currentSum} >= ${target} (len ${spanLen})` },
          { left, right, currentSum, spanLen, minLen }
        );

        currentSum -= arr[left];
        left++;
      }
    }

    const finalResult = minLen === Infinity ? 0 : minLen;
    const finalMarks: Record<number, ArrayCellMark> = {};
    if (minLen !== Infinity && bestLeft >= 0) {
      for (let k = bestLeft; k <= bestRight; k++) finalMarks[k] = 'found';
    }

    record(
      finalResult > 0
        ? `Minimal subarray satisfying sum ≥ ${target} has length ${finalResult} (span [${bestLeft}..${bestRight}]).`
        : `No subarray achieves sum ≥ ${target}. Returning 0.`,
      8,
      minLen !== Infinity && bestLeft >= 0
        ? [
            { name: 'min_L', index: bestLeft, color: 'accent' },
            { name: 'min_R', index: bestRight, color: 'accent' },
          ]
        : [],
      finalMarks,
      minLen !== Infinity && bestLeft >= 0
        ? { from: bestLeft, to: bestRight, label: `Min valid span: len ${finalResult}` }
        : undefined,
      { target, minLen: finalResult, result: finalResult },
      finalResult
    );

    return steps;
  },
};

export default slidingWindowVariableDefinition;

