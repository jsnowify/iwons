/**
 * Insertion Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateNearlySortedNumbers, generateReversedNumbers } from '../../core/inputs';

export const insertionSortDefinition: AlgoDefinition<number[]> = {
  id: 'insertion-sort',
  name: 'Insertion Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Iteratively takes each unsorted element and shifts larger sorted elements to the right to insert it into its correct relative position.',
  pseudocode: [
    'procedure insertionSort(A):',
    '  for i := 1 to length(A) - 1 do:',
    '    key := A[i]',
    '    j := i - 1',
    '    while j >= 0 and A[j] > key do:',
    '      A[j + 1] := A[j]',
    '      j := j - 1',
    '    A[j + 1] := key',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Typical unsorted input array.',
      input: [52, 19, 44, 11, 78, 30, 65, 23],
    },
    {
      name: 'nearly-sorted',
      label: 'Best Case (Nearly Sorted)',
      description: 'Fast O(n) execution requiring minimal shifting.',
      input: generateNearlySortedNumbers(8),
    },
    {
      name: 'reversed',
      label: 'Worst Case (Reversed)',
      description: 'Strictly reversed array requiring maximal shifts on every key.',
      input: generateReversedNumbers(7, 70, 9),
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
        arr.length === 0 ? 'Array is empty; already sorted.' : `Single element [${arr[0]}] is sorted.`,
        1,
        arr.length === 1 ? { 0: 'sorted' } : undefined
      );
      return steps;
    }

    record('Start Insertion Sort. Single element at index 0 forms initial sorted prefix.', 1, { 0: 'sorted' });

    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;

      const marks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (let k = 0; k < i; k++) marks[k] = 'sorted';
      marks[i] = 'selected';

      record(`Select key element A[${i}]=${key} to insert into sorted prefix [0..${i - 1}].`, 3, marks, {
        i,
        key,
        j,
      });

      while (j >= 0) {
        comparisons++;
        const compMarks = { ...marks };
        compMarks[j] = 'compared';
        compMarks[j + 1] = 'selected';

        record(`Compare sorted element A[${j}]=${arr[j]} with key ${key}.`, 5, compMarks, {
          j,
          'A[j]': arr[j],
          key,
          comparisons,
        });

        if (arr[j] > key) {
          arr[j + 1] = arr[j];
          swaps++;
          const shiftMarks = { ...marks };
          shiftMarks[j + 1] = 'swapped';
          shiftMarks[j] = 'range';

          record(
            `Shift ${arr[j]} rightward to position ${j + 1} because ${arr[j]} > ${key}.`,
            6,
            shiftMarks,
            { j, shifted: arr[j], key, swaps }
          );
          j--;
        } else {
          record(`${arr[j]} <= ${key}. Insertion position found at index ${j + 1}.`, 5, marks, {
            j,
            'A[j]': arr[j],
            key,
          });
          break;
        }
      }

      arr[j + 1] = key;
      const placedMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (let k = 0; k <= i; k++) placedMarks[k] = 'sorted';

      record(`Insert key ${key} into position ${j + 1}. Sorted prefix now length ${i + 1}.`, 8, placedMarks, {
        key,
        insertedAt: j + 1,
        prefixLength: i + 1,
      });
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Insertion Sort complete in ${comparisons} comparisons and ${swaps} shifts.`, 8, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default insertionSortDefinition;

