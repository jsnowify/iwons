/**
 * Counting Sort - Engine 1 (Bars with Auxiliary Count Buffer)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';

export const countingSortDefinition: AlgoDefinition<number[]> = {
  id: 'counting-sort',
  name: 'Counting Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n + k)',
    average: 'O(n + k)',
    worst: 'O(n + k)',
    space: 'O(k)',
  },
  inputKind: 'numbers',
  blurb: 'Non-comparison sorting algorithm that operates by counting the number of objects possessing each distinct key value, using arithmetic on frequencies to place elements directly into their final positions.',
  pseudocode: [
    'procedure countingSort(A):',
    '  find min and max values to determine range k',
    '  count := array of size k initialized to 0',
    '  for each x in A do:',
    '    count[x - min] := count[x - min] + 1',
    '  reconstruct sorted array from count frequencies',
  ],
  presets: [
    {
      name: 'small-range',
      label: 'Small Range (0 to 9)',
      description: 'Ideal scenario where range k is small relative to n.',
      input: [4, 2, 2, 8, 3, 3, 1, 9, 4],
    },
    {
      name: 'duplicates',
      label: 'Heavy Duplicates',
      description: 'Many equal elements demonstrating frequency tallying.',
      input: [5, 1, 3, 1, 5, 3, 3, 1, 5],
    },
    {
      name: 'six-keys',
      label: '6 Distinct Keys',
      description: 'Clear frequency counts in auxiliary buffer.',
      input: [6, 1, 4, 2, 6, 2, 4, 1],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const raw = [...input];
    const arr = raw.map(v => Math.round(v));
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

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min + 1;
    const countArr: number[] = new Array(range).fill(0);

    const record = (
      caption: string,
      line: number,
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
            label: `Count Frequencies (keys ${min}..${max})`,
            values: [...countArr],
          },
        },
      });
    };

    record(`Determine range: min=${min}, max=${max}, range=${range}. Initialized count buffer to 0.`, 3, undefined, {
      min,
      max,
      range,
    });

    // Count frequencies
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      countArr[val - min]++;
      record(`Inspect A[${i}]=${val}. Increment frequency of key ${val} in count buffer to ${countArr[val - min]}.`, 5, {
        [i]: 'selected',
      }, { i, val, newCount: countArr[val - min] });
    }

    record('Frequency tallying complete. Phase 2: Overwrite array in sorted order.', 6, undefined, {
      frequencies: countArr.join(', '),
    });

    // Write back sorted elements
    let writeIdx = 0;
    const sortedIndices = new Set<number>();

    for (let c = 0; c < range; c++) {
      const val = c + min;
      while (countArr[c] > 0) {
        arr[writeIdx] = val;
        sortedIndices.add(writeIdx);
        countArr[c]--;

        const marks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
        for (const idx of sortedIndices) marks[idx] = 'sorted';
        marks[writeIdx] = 'swapped';

        record(
          `Place key ${val} at index ${writeIdx}. Remaining count for ${val} is ${countArr[c]}.`,
          6,
          marks,
          { placedVal: val, writeIdx, remainingCount: countArr[c] }
        );

        writeIdx++;
      }
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Counting Sort complete. Array sorted without element-to-element comparisons.`, 6, finalMarks, {
      status: 'Sorted',
      range,
    });

    return steps;
  },
};

export default countingSortDefinition;
