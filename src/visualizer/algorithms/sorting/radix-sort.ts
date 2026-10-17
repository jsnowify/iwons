/**
 * Radix Sort - Engine 1 (Bars with Auxiliary Digit Buckets)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';

export const radixSortDefinition: AlgoDefinition<number[]> = {
  id: 'radix-sort',
  name: 'Radix Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(d · (n + b))',
    average: 'O(d · (n + b))',
    worst: 'O(d · (n + b))',
    space: 'O(n + b)',
  },
  inputKind: 'numbers',
  blurb: 'Sorts keys digit by digit starting from the least significant digit (LSD) to the most significant digit, using a stable counting sort pass on each digit position.',
  pseudocode: [
    'procedure radixSort(A):',
    '  maxVal := findMax(A)',
    '  exp := 1  // 1 for 1s, 10 for 10s, 100 for 100s',
    '  while maxVal / exp > 0 do:',
    '    countingSortByDigit(A, exp)',
    '    exp := exp * 10',
  ],
  presets: [
    {
      name: 'random-integers',
      label: '2-Digit Numbers (8 elements)',
      description: 'Sorts over 1s and 10s digits.',
      input: [45, 12, 85, 32, 89, 39, 69, 44],
    },
    {
      name: 'three-digit',
      label: '3-Digit Numbers',
      description: 'Requires 3 passes across 1s, 10s, and 100s digits.',
      input: [170, 45, 75, 90, 802, 24, 2, 66],
    },
    {
      name: 'descending',
      label: 'Descending Values',
      description: 'Reversed numbers demonstrating stable rearrangement.',
      input: [98, 76, 54, 43, 32, 21, 10],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const raw = [...input];
    const arr = raw.map(v => Math.max(0, Math.min(999, Math.round(Math.abs(v)))));
    const steps: BarsStep[] = [];

    if (arr.length <= 1) {
      steps.push({
        engine: 'bars',
        caption: arr.length === 0 ? 'Array is empty.' : `Single element [${arr[0]}] is sorted.`,
        line: 1,
        bars: { values: [...arr], marks: arr.length === 1 ? { 0: 'sorted' } : undefined },
      });
      return steps;
    }

    const maxVal = Math.max(...arr);
    let digitCount: number[] = new Array(10).fill(0);

    const record = (
      caption: string,
      line: number,
      exp: number,
      marks?: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'>,
      vars?: Record<string, string | number | boolean>
    ) => {
      steps.push({
        engine: 'bars',
        caption,
        line,
        vars,
        bars: {
          values: [...arr],
          marks: marks ? { ...marks } : undefined,
          auxiliary: {
            label: `Digit Buckets (Base 10, Place ${exp})`,
            values: [...digitCount],
          },
        },
      });
    };

    record(`Maximum value is ${maxVal}. Starting LSD Radix Sort pass with 1s digit.`, 2, 1, undefined, { maxVal, exp: 1 });

    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
      const placeName = exp === 1 ? 'Units (1s)' : exp === 10 ? 'Tens (10s)' : `${exp}s`;
      digitCount = new Array(10).fill(0);

      record(`Begin pass for ${placeName} place. Initialized 10 digit buckets to 0.`, 5, exp, undefined, {
        place: placeName,
        exp,
      });

      // Tally digit frequencies
      for (let i = 0; i < arr.length; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        digitCount[digit]++;
        record(
          `Extract digit of ${arr[i]} at ${placeName}: (${arr[i]} / ${exp}) % 10 = ${digit}. Increment bucket ${digit}.`,
          5,
          exp,
          { [i]: 'selected' },
          { val: arr[i], digit, bucketCount: digitCount[digit] }
        );
      }

      // Build output buffer using counting sort logic
      const output = new Array(arr.length).fill(0);
      const countAccum = [...digitCount];
      for (let i = 1; i < 10; i++) countAccum[i] += countAccum[i - 1];

      for (let i = arr.length - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[countAccum[digit] - 1] = arr[i];
        countAccum[digit]--;
      }

      // Copy back to array
      for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
      }

      const passMarks: Record<number, 'swapped'> = {};
      for (let k = 0; k < arr.length; k++) passMarks[k] = 'swapped';

      record(`Finished stable rearrangement for ${placeName} place. Array now ordered by lower digits.`, 6, exp, passMarks, {
        passCompleted: placeName,
      });
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Radix Sort complete. All digit passes processed stably.`, 6, 1, finalMarks, { status: 'Sorted' });

    return steps;
  },
};

export default radixSortDefinition;

