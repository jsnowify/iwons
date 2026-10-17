/**
 * Interpolation Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const interpolationSearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'interpolation-search',
  name: 'Interpolation Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(log log n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Estimates the likely position of a target value within a sorted, uniformly distributed array using a linear interpolation formula, mirroring how humans search a telephone book.',
  pseudocode: [
    'procedure interpolationSearch(A, target):',
    '  low := 0, high := length(A) - 1',
    '  while low <= high and target >= A[low] and target <= A[high] do:',
    '    if low = high then:',
    '      if A[low] = target return low else return -1',
    '    pos := low + floor(((target - A[low]) * (high - low)) / (A[high] - A[low]))',
    '    if A[pos] = target return pos',
    '    if A[pos] < target then low := pos + 1 else high := pos - 1',
    '  return -1',
  ],
  presets: [
    {
      name: 'uniform-direct-hit',
      label: 'Uniform Array (Find 50)',
      description: 'Interpolation calculates the exact index on the first probe.',
      input: { target: 50, numbers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
    },
    {
      name: 'uniform-probe-2',
      label: 'Non-Uniform Steps (Find 35)',
      description: 'Converges in two probes on approximately uniform data.',
      input: { target: 35, numbers: [5, 12, 19, 27, 35, 48, 59, 71, 85] },
    },
    {
      name: 'out-of-bounds',
      label: 'Out of Range (Find 120)',
      description: 'Target exceeds A[high]; bounds check terminates immediately in O(1).',
      input: { target: 120, numbers: [10, 25, 40, 55, 70, 85, 100] },
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
      record(`Array is empty. Target ${target} not found.`, 8, [], {}, undefined, { target }, -1);
      return steps;
    }

    let low = 0;
    let high = n - 1;

    record(
      `Initialize Interpolation Search for target ${target} in sorted range [0..${high}].`,
      1,
      [
        { name: 'low', index: low, color: 'primary' },
        { name: 'high', index: high, color: 'primary' },
      ],
      {},
      { from: low, to: high, label: 'Search interval' },
      { low, high, 'A[low]': arr[low], 'A[high]': arr[high], target }
    );

    while (low <= high && target >= arr[low] && target <= arr[high]) {
      const activeMarks: Record<number, ArrayCellMark> = {};
      for (let i = 0; i < n; i++) {
        if (i < low || i > high) activeMarks[i] = 'eliminated';
      }

      if (arr[high] === arr[low]) {
        if (arr[low] === target) {
          activeMarks[low] = 'found';
          record(
            `Uniform value at index ${low} equals target ${target}.`,
            4,
            [{ name: 'found', index: low, color: 'accent' }],
            activeMarks,
            undefined,
            { low, result: low },
            low
          );
          return steps;
        }
        break;
      }

      // Interpolation probe formula
      const fraction = (target - arr[low]) / (arr[high] - arr[low]);
      const pos = low + Math.floor(fraction * (high - low));
      activeMarks[pos] = 'checking';

      const pointers: ArrayPointer[] = [
        { name: 'low', index: low, color: 'primary' },
        { name: 'pos', index: pos, color: 'accent' },
        { name: 'high', index: high, color: 'primary' },
      ];

      record(
        `Compute probe pos = ${low} + floor((${target} - ${arr[low]}) / (${arr[high]} - ${arr[low]}) · (${high} - ${low})) = ${pos}. Inspect A[${pos}]=${arr[pos]}.`,
        5,
        pointers,
        activeMarks,
        { from: low, to: high, label: `Interpolation fraction: ${(fraction * 100).toFixed(1)}%` },
        { low, high, pos, fraction: fraction.toFixed(3), 'A[pos]': arr[pos], target }
      );

      if (arr[pos] === target) {
        activeMarks[pos] = 'found';
        record(
          `Target found! A[${pos}] equals ${target}. Returning index ${pos}.`,
          6,
          [{ name: 'found', index: pos, color: 'accent' }],
          activeMarks,
          undefined,
          { pos, target, result: pos },
          pos
        );
        return steps;
      }

      if (arr[pos] < target) {
        record(
          `A[${pos}] (${arr[pos]}) < ${target}. Target is in upper subrange. Update low := ${pos + 1}.`,
          7,
          pointers,
          activeMarks,
          undefined,
          { low: pos + 1, high, target }
        );
        low = pos + 1;
      } else {
        record(
          `A[${pos}] (${arr[pos]}) > ${target}. Target is in lower subrange. Update high := ${pos - 1}.`,
          7,
          pointers,
          activeMarks,
          undefined,
          { low, high: pos - 1, target }
        );
        high = pos - 1;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let i = 0; i < n; i++) allEliminated[i] = 'eliminated';

    record(
      `Target ${target} falls outside candidate interval or interval exhausted. Return -1.`,
      8,
      [],
      allEliminated,
      undefined,
      { target, result: -1 },
      -1
    );

    return steps;
  },
};

export default interpolationSearchDefinition;
