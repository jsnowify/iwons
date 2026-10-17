/**
 * Shell Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers } from '../../core/inputs';

export const shellSortDefinition: AlgoDefinition<number[]> = {
  id: 'shell-sort',
  name: 'Shell Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n^(4/3))',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Generalizes insertion sort by allowing exchanges of far-apart elements. Compares elements separated by diminishing gaps (gap = n/2, n/4, ..., 1) to eliminate large inversions early.',
  pseudocode: [
    'procedure shellSort(A):',
    '  n := length(A)',
    '  gap := floor(n / 2)',
    '  while gap > 0 do:',
    '    for i := gap to n - 1 do:',
    '      temp := A[i]; j := i',
    '      while j >= gap and A[j - gap] > temp do:',
    '        A[j] := A[j - gap]; j := j - gap',
    '      A[j] := temp',
    '    gap := floor(gap / 2)',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Diminishing gap passes: 4, 2, 1.',
      input: [62, 83, 18, 53, 7, 17, 95, 22],
    },
    {
      name: 'reversed',
      label: 'Reversed Array',
      description: 'High-inversion input where large gaps quickly move small elements to front.',
      input: generateReversedNumbers(8, 85, 10),
    },
    {
      name: 'ten',
      label: '10 Elements',
      description: 'Multiple gap stages demonstrating diminishing strides.',
      input: [35, 33, 42, 10, 14, 19, 27, 44, 26, 31],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const arr = [...input];
    const steps: BarsStep[] = [];
    let comparisons = 0;
    let swaps = 0;

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
          counters: { comparisons, swaps },
        },
      });
    };

    if (arr.length <= 1) {
      record(
        arr.length === 0 ? 'Array is empty.' : `Single element [${arr[0]}] is sorted.`,
        1,
        arr.length === 1 ? { 0: 'sorted' } : undefined
      );
      return steps;
    }

    const n = arr.length;
    let gap = Math.floor(n / 2);

    record(`Start Shell Sort with initial gap floor(${n} / 2) = ${gap}.`, 3, undefined, { gap, n });

    while (gap > 0) {
      record(`Begin gapped insertion sort pass with gap = ${gap}.`, 4, undefined, { gap });

      for (let i = gap; i < n; i++) {
        const temp = arr[i];
        let j = i;

        record(`Select element A[${i}]=${temp} for gapped comparison with A[${i - gap}]=${arr[i - gap]}.`, 6, {
          [i]: 'selected',
          [i - gap]: 'range',
        }, { i, temp, gap, j });

        while (j >= gap) {
          comparisons++;
          const compMarks: Record<number, 'compared' | 'swapped' | 'selected'> = {
            [j]: 'selected',
            [j - gap]: 'compared',
          };

          record(`Compare A[${j - gap}]=${arr[j - gap]} with temp ${temp}.`, 7, compMarks, {
            j,
            'A[j - gap]': arr[j - gap],
            temp,
            comparisons,
          });

          if (arr[j - gap] > temp) {
            arr[j] = arr[j - gap];
            swaps++;
            record(
              `Shift ${arr[j]} forward by gap ${gap} to index ${j}.`,
              8,
              { [j]: 'swapped', [j - gap]: 'range' },
              { j, shifted: arr[j], swaps }
            );
            j -= gap;
          } else {
            break;
          }
        }

        arr[j] = temp;
        record(`Insert temp ${temp} at gapped position index ${j}.`, 9, { [j]: 'selected' }, { j, temp });
      }

      gap = Math.floor(gap / 2);
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Shell Sort complete in ${comparisons} comparisons and ${swaps} shifts.`, 10, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default shellSortDefinition;
