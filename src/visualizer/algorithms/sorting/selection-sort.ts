/**
 * Selection Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers, generateSortedNumbers } from '../../core/inputs';

export const selectionSortDefinition: AlgoDefinition<number[]> = {
  id: 'selection-sort',
  name: 'Selection Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Divides the list into a sorted prefix and an unsorted suffix. Repeatedly scans the unsorted suffix to find the minimum element and swaps it into place.',
  pseudocode: [
    'procedure selectionSort(A):',
    '  n := length(A)',
    '  for i := 0 to n - 2 do:',
    '    minIdx := i',
    '    for j := i + 1 to n - 1 do:',
    '      if A[j] < A[minIdx] then:',
    '        minIdx := j',
    '    if minIdx != i then:',
    '      swap(A[i], A[minIdx])',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Typical unsorted input array.',
      input: [64, 25, 12, 22, 11, 48, 33, 19],
    },
    {
      name: 'reversed',
      label: 'Worst Case (Reversed)',
      description: 'Strictly decreasing order requires swaps on every outer iteration.',
      input: generateReversedNumbers(8, 70, 8),
    },
    {
      name: 'already-sorted',
      label: 'Already Sorted',
      description: 'Array already in order; still performs O(n²) comparisons.',
      input: generateSortedNumbers(7, 10, 8),
    },
    {
      name: 'duplicates',
      label: 'With Duplicates',
      description: 'Multiple identical values handled without instability issues.',
      input: [30, 10, 50, 10, 50, 20, 30],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const arr = [...input];
    const steps: BarsStep[] = [];
    let comparisons = 0;
    let swaps = 0;
    const sortedIndices = new Set<number>();

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

    record('Start Selection Sort with unsorted array.', 1);

    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      const getMarks = () => {
        const m: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
        for (const idx of sortedIndices) m[idx] = 'sorted';
        m[i] = 'range';
        m[minIdx] = 'selected';
        return m;
      };

      record(`Begin outer loop at index ${i}. Assume current minimum is A[${i}]=${arr[i]}.`, 4, getMarks(), {
        i,
        minIdx,
        'A[minIdx]': arr[minIdx],
      });

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        const marks = getMarks();
        marks[j] = 'compared';
        marks[minIdx] = 'selected';

        record(
          `Compare A[${j}]=${arr[j]} with current minimum A[${minIdx}]=${arr[minIdx]}.`,
          6,
          marks,
          { i, j, minIdx, 'A[j]': arr[j], 'A[minIdx]': arr[minIdx], comparisons }
        );

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          const newMarks = getMarks();
          newMarks[minIdx] = 'selected';
          record(`Found smaller element! Update minimum index to ${minIdx} (value ${arr[minIdx]}).`, 7, newMarks, {
            i,
            j,
            newMinIdx: minIdx,
            'A[minIdx]': arr[minIdx],
          });
        }
      }

      if (minIdx !== i) {
        const swapMarks = getMarks();
        swapMarks[i] = 'swapped';
        swapMarks[minIdx] = 'swapped';
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
        swaps++;

        record(
          `Swap minimum element ${arr[i]} into target position index ${i}.`,
          9,
          swapMarks,
          { i, minIdx, swappedVal: arr[i], comparisons, swaps }
        );
      } else {
        record(`Element at index ${i} is already the smallest remaining. No swap needed.`, 8, getMarks(), {
          i,
          minIdx,
        });
      }

      sortedIndices.add(i);
    }

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Selection Sort complete in ${comparisons} comparisons and ${swaps} swaps.`, 9, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default selectionSortDefinition;
