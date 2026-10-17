/**
 * Merge Sort - Engine 1 (Bars with Auxiliary Buffer)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateRandomNumbers, generateReversedNumbers } from '../../core/inputs';

export const mergeSortDefinition: AlgoDefinition<number[]> = {
  id: 'merge-sort',
  name: 'Merge Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Divide-and-conquer algorithm that recursively splits the array in half, sorts each half, and merges the two sorted subarrays using an auxiliary buffer.',
  pseudocode: [
    'procedure mergeSort(A, left, right):',
    '  if left < right then:',
    '    mid := floor((left + right) / 2)',
    '    mergeSort(A, left, mid)',
    '    mergeSort(A, mid + 1, right)',
    '    merge(A, left, mid, right)',
    'procedure merge(A, left, mid, right):',
    '  copy left and right into temp buffer',
    '  while elements remain in both halves do:',
    '    pick smaller element and copy to A',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Standard divide-and-conquer execution.',
      input: [38, 27, 43, 3, 9, 82, 10, 55],
    },
    {
      name: 'reversed',
      label: 'Worst Case (Reversed)',
      description: 'Stable O(n log n) execution guaranteed on reverse input.',
      input: generateReversedNumbers(8, 80, 10),
    },
    {
      name: 'sixteen',
      label: 'Power of Two (8 elements)',
      description: 'Perfect balanced tree with equal partition depths.',
      input: generateRandomNumbers(8, 10, 99, 505),
    },
  ],
  generate(input: number[]): BarsStep[] {
    const arr = [...input];
    const steps: BarsStep[] = [];
    let comparisons = 0;
    let swaps = 0;
    const aux: (number | null)[] = new Array(arr.length).fill(null);

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
          auxiliary: {
            label: 'Temporary Merge Buffer',
            values: [...aux],
          },
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

    record('Start Merge Sort. Initial array with empty auxiliary merge buffer below.', 1);

    function sort(left: number, right: number) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);

      const splitMarks: Record<number, 'range' | 'selected'> = {};
      for (let k = left; k <= right; k++) splitMarks[k] = 'range';
      splitMarks[mid] = 'selected';

      record(`Divide range [${left}..${right}] at mid index ${mid}.`, 3, splitMarks, { left, mid, right });

      sort(left, mid);
      sort(mid + 1, right);

      merge(left, mid, right);
    }

    function merge(left: number, mid: number, right: number) {
      const leftPart = arr.slice(left, mid + 1);
      const rightPart = arr.slice(mid + 1, right + 1);

      // Copy into aux buffer for visibility
      for (let k = left; k <= right; k++) aux[k] = arr[k];

      const rangeMarks: Record<number, 'range' | 'selected'> = {};
      for (let k = left; k <= mid; k++) rangeMarks[k] = 'range';
      for (let k = mid + 1; k <= right; k++) rangeMarks[k] = 'selected';

      record(
        `Merge left half [${left}..${mid}] and right half [${mid + 1}..${right}]. Copied to buffer.`,
        8,
        rangeMarks,
        { left, mid, right }
      );

      let i = 0, j = 0, k = left;
      while (i < leftPart.length && j < rightPart.length) {
        comparisons++;
        const compMarks: Record<number, 'compared' | 'swapped'> = {
          [left + i]: 'compared',
          [mid + 1 + j]: 'compared',
        };

        record(
          `Compare buffer elements: ${leftPart[i]} vs ${rightPart[j]}.`,
          10,
          compMarks,
          { 'leftVal': leftPart[i], 'rightVal': rightPart[j], comparisons }
        );

        if (leftPart[i] <= rightPart[j]) {
          arr[k] = leftPart[i];
          swaps++;
          aux[left + i] = null;
          record(`Pick smaller element ${leftPart[i]} and place at index ${k}.`, 10, { [k]: 'swapped' }, { placed: leftPart[i], k });
          i++;
        } else {
          arr[k] = rightPart[j];
          swaps++;
          aux[mid + 1 + j] = null;
          record(`Pick smaller element ${rightPart[j]} and place at index ${k}.`, 10, { [k]: 'swapped' }, { placed: rightPart[j], k });
          j++;
        }
        k++;
      }

      while (i < leftPart.length) {
        arr[k] = leftPart[i];
        swaps++;
        aux[left + i] = null;
        record(`Copy remaining left element ${leftPart[i]} into index ${k}.`, 10, { [k]: 'swapped' }, { placed: leftPart[i], k });
        i++;
        k++;
      }

      while (j < rightPart.length) {
        arr[k] = rightPart[j];
        swaps++;
        aux[mid + 1 + j] = null;
        record(`Copy remaining right element ${rightPart[j]} into index ${k}.`, 10, { [k]: 'swapped' }, { placed: rightPart[j], k });
        j++;
        k++;
      }

      const mergedMarks: Record<number, 'range'> = {};
      for (let m = left; m <= right; m++) mergedMarks[m] = 'range';
      record(`Subarrays merged. Range [${left}..${right}] is now sorted.`, 6, mergedMarks, { left, right });
    }

    sort(0, arr.length - 1);

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Merge Sort complete in ${comparisons} comparisons and ${swaps} copies.`, 10, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default mergeSortDefinition;

