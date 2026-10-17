/**
 * Two Pointers (Pair Sum) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const twoPointersPairSumDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'two-pointers-pair-sum',
  name: 'Two Pointers (Pair Sum)',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Maintains two inward-moving pointers (left and right) on a sorted array to locate a pair of elements that sum exactly to the target value in linear time.',
  pseudocode: [
    'procedure pairSum(A, target):',
    '  left := 0, right := length(A) - 1',
    '  while left < right do:',
    '    currentSum := A[left] + A[right]',
    '    if currentSum = target return (left, right)',
    '    if currentSum < target then left := left + 1',
    '    else right := right - 1',
    '  return (-1, -1)  // no pair exists',
  ],
  presets: [
    {
      name: 'pair-found',
      label: 'Pair Found (Target 16)',
      description: 'Finds pair 6 + 10 = 16 after three inward pointer moves.',
      input: { target: 16, numbers: [1, 3, 6, 8, 10, 15, 20] },
    },
    {
      name: 'extreme-pair',
      label: 'Outer Boundary Pair (Target 21)',
      description: 'First and last elements immediately sum to target.',
      input: { target: 21, numbers: [1, 4, 7, 11, 14, 18, 20] },
    },
    {
      name: 'no-pair',
      label: 'No Pair Sum (Target 30)',
      description: 'Pointers meet in middle without any combination matching target.',
      input: { target: 30, numbers: [2, 5, 8, 11, 14, 17, 19] },
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

    if (n < 2) {
      record(`Array has fewer than 2 elements. No pair can exist.`, 8, [], {}, undefined, { target }, null);
      return steps;
    }

    let left = 0;
    let right = n - 1;

    record(
      `Initialize Two Pointers for target sum ${target}. Left at index 0, right at index ${right}.`,
      1,
      [
        { name: 'left', index: left, color: 'primary' },
        { name: 'right', index: right, color: 'accent' },
      ],
      { [left]: 'checking', [right]: 'checking' },
      { from: left, to: right, label: 'Search span' },
      { left, right, 'A[left]': arr[left], 'A[right]': arr[right], target }
    );

    while (left < right) {
      const sum = arr[left] + arr[right];
      const marks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < left; k++) marks[k] = 'eliminated';
      for (let k = right + 1; k < n; k++) marks[k] = 'eliminated';
      marks[left] = 'checking';
      marks[right] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'left', index: left, color: 'primary' },
        { name: 'right', index: right, color: 'accent' },
      ];

      record(
        `Evaluate pair: A[${left}] + A[${right}] = ${arr[left]} + ${arr[right]} = ${sum}. Target is ${target}.`,
        4,
        pointers,
        marks,
        { from: left, to: right, label: `Sum: ${sum}` },
        { left, right, 'A[left]': arr[left], 'A[right]': arr[right], currentSum: sum, target }
      );

      if (sum === target) {
        marks[left] = 'found';
        marks[right] = 'found';
        record(
          `Target sum reached! A[${left}] (${arr[left]}) + A[${right}] (${arr[right]}) = ${target}. Pair indices (${left}, ${right}).`,
          5,
          pointers,
          marks,
          { from: left, to: right, label: `Matched: ${arr[left]} + ${arr[right]} = ${target}` },
          { left, right, sum: target, result: `(${left}, ${right})` },
          `[${left}, ${right}]`
        );
        return steps;
      }

      if (sum < target) {
        marks[left] = 'eliminated';
        record(
          `Sum ${sum} < ${target}. To increase sum, increment left pointer from ${left} to ${left + 1}.`,
          6,
          pointers,
          marks,
          undefined,
          { left: left + 1, right, currentSum: sum, target }
        );
        left++;
      } else {
        marks[right] = 'eliminated';
        record(
          `Sum ${sum} > ${target}. To decrease sum, decrement right pointer from ${right} to ${right - 1}.`,
          7,
          pointers,
          marks,
          undefined,
          { left, right: right - 1, currentSum: sum, target }
        );
        right--;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `Pointers met (left=${left}, right=${right}). No pair sums to target ${target}.`,
      8,
      [],
      allEliminated,
      undefined,
      { target, result: 'None' },
      null
    );

    return steps;
  },
};

export default twoPointersPairSumDefinition;

