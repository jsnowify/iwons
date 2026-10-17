/**
 * Prefix Sum Array - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const prefixSumDefinition: AlgoDefinition<number[]> = {
  id: 'prefix-sum',
  name: 'Prefix Sum Array',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Precomputes cumulative running sums across the array, allowing any subsequent subarray sum query sum(L..R) to be calculated in O(1) constant time as prefix[R] - prefix[L - 1].',
  pseudocode: [
    'procedure buildPrefixSum(A):',
    '  P[0] := A[0]',
    '  for i := 1 to length(A) - 1 do:',
    '    P[i] := P[i - 1] + A[i]',
    '  // Range query demonstration:',
    '  querySum(L, R) := P[R] - (L > 0 ? P[L - 1] : 0)',
    '  return P',
  ],
  presets: [
    {
      name: 'balanced-values',
      label: 'Balanced Values (7 elements)',
      description: 'Standard positive sequence demonstrating cumulative accumulation.',
      input: [3, 1, 4, 1, 5, 9, 2],
    },
    {
      name: 'with-negatives',
      label: 'Includes Negatives',
      description: 'Running sum fluctuates up and down with signed values.',
      input: [4, -2, 7, -5, 3, 6, -1],
    },
    {
      name: 'powers-of-two',
      label: 'Geometric Series',
      description: 'Rapidly growing cumulative running sums.',
      input: [1, 2, 4, 8, 16, 32],
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
      currentValues: number[],
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
          values: [...currentValues],
          pointers,
          ranges: range ? [range] : undefined,
          marks,
          result,
        },
      });
    };

    if (n === 0) {
      record('Array is empty. Prefix sum is empty.', 7, [], [], undefined, undefined, {}, null);
      return steps;
    }

    const prefix: number[] = new Array(n).fill(0);
    prefix[0] = arr[0];

    record(
      `Initialize: original array has ${n} elements. First prefix element P[0] = A[0] = ${arr[0]}.`,
      2,
      [{ name: 'P[0]', index: 0, color: 'accent' }],
      [prefix[0], ...arr.slice(1)],
      { 0: 'found' },
      undefined,
      { 'P[0]': prefix[0], 'A[0]': arr[0] }
    );

    // Build prefix array in place step by step
    const displayArr = [...arr];
    displayArr[0] = prefix[0];

    for (let i = 1; i < n; i++) {
      prefix[i] = prefix[i - 1] + arr[i];
      displayArr[i] = prefix[i];

      const marks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < i; k++) marks[k] = 'window';
      marks[i - 1] = 'checking';
      marks[i] = 'found';

      record(
        `Compute P[${i}] = P[${i - 1}] (${prefix[i - 1]}) + A[${i}] (${arr[i]}) = ${prefix[i]}.`,
        4,
        [
          { name: `P[${i - 1}]`, index: i - 1, color: 'primary' },
          { name: `P[${i}]`, index: i, color: 'accent' },
        ],
        displayArr,
        marks,
        { from: 0, to: i, label: `Prefix sum 0..${i}: ${prefix[i]}` },
        { i, 'P[i-1]': prefix[i - 1], 'A[i]': arr[i], 'P[i]': prefix[i] }
      );
    }

    // Range Query Demonstration
    const L = Math.min(1, n - 1);
    const R = Math.max(L, n - 2);
    const rangeSum = prefix[R] - (L > 0 ? prefix[L - 1] : 0);

    const queryMarks: Record<number, ArrayCellMark> = {};
    for (let k = L; k <= R; k++) queryMarks[k] = 'found';
    if (L > 0) queryMarks[L - 1] = 'checking';

    record(
      `Range Query Demo: compute sum of original A[${L}..${R}] in O(1) time. Formula: P[${R}] (${prefix[R]}) - ${L > 0 ? `P[${L - 1}] (${prefix[L - 1]})` : '0'} = ${rangeSum}.`,
      6,
      [
        ...(L > 0 ? [{ name: 'L-1', index: L - 1, color: 'primary' as const }] : []),
        { name: 'R', index: R, color: 'accent' as const },
      ],
      prefix,
      queryMarks,
      { from: L, to: R, label: `Range sum A[${L}..${R}] = ${rangeSum}` },
      { L, R, 'P[R]': prefix[R], 'P[L-1]': L > 0 ? prefix[L - 1] : 0, rangeSum },
      rangeSum
    );

    return steps;
  },
};

export default prefixSumDefinition;

