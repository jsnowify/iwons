/**
 * Quicksort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateNearlySortedNumbers, generateReversedNumbers } from '../../core/inputs';

export const quickSortDefinition: AlgoDefinition<number[]> = {
  id: 'quick-sort',
  name: 'Quicksort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
  },
  inputKind: 'numbers',
  blurb: 'Partitions the array around a chosen pivot so elements smaller than the pivot precede it and larger elements follow it, then sorts the partitions recursively.',
  pseudocode: [
    'procedure quickSort(A, low, high):',
    '  if low < high then:',
    '    p := partition(A, low, high)',
    '    quickSort(A, low, p - 1)',
    '    quickSort(A, p + 1, high)',
    'procedure partition(A, low, high):',
    '  pivot := A[high]',
    '  i := low',
    '  for j := low to high - 1 do:',
    '    if A[j] <= pivot then:',
    '      swap(A[i], A[j]); i := i + 1',
    '  swap(A[i], A[high]); return i',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Typical partition tree with balanced pivots.',
      input: [42, 17, 88, 31, 65, 12, 74, 53],
    },
    {
      name: 'nearly-sorted',
      label: 'Nearly Sorted Array',
      description: 'Demonstrates partitioning on pre-ordered keys.',
      input: generateNearlySortedNumbers(8),
    },
    {
      name: 'duplicates',
      label: 'Array with Duplicates',
      description: 'Handles elements matching the pivot value cleanly.',
      input: [40, 20, 60, 40, 80, 40, 10],
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

    record('Start Quicksort with unsorted array.', 1);

    function sort(low: number, high: number) {
      if (low >= high) {
        if (low === high) sortedIndices.add(low);
        return;
      }

      const p = partition(low, high);
      sort(low, p - 1);
      sort(p + 1, high);
    }

    function partition(low: number, high: number): number {
      const pivot = arr[high];
      let i = low;

      const pMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) pMarks[idx] = 'sorted';
      for (let k = low; k <= high; k++) pMarks[k] = 'range';
      pMarks[high] = 'pivot';

      record(`Select pivot ${pivot} at index ${high} for range [${low}..${high}].`, 7, pMarks, {
        low,
        high,
        pivot,
      });

      for (let j = low; j < high; j++) {
        comparisons++;
        const compMarks = { ...pMarks };
        compMarks[j] = 'compared';
        compMarks[i] = 'selected';
        compMarks[high] = 'pivot';

        record(
          `Compare A[${j}]=${arr[j]} with pivot ${pivot}. Boundary i is at ${i}.`,
          10,
          compMarks,
          { j, 'A[j]': arr[j], pivot, i, comparisons }
        );

        if (arr[j] <= pivot) {
          if (i !== j) {
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            swaps++;

            const swapMarks = { ...pMarks };
            swapMarks[i] = 'swapped';
            swapMarks[j] = 'swapped';
            swapMarks[high] = 'pivot';

            record(
              `Swap A[${i}]=${arr[i]} and A[${j}]=${arr[j]} into smaller partition. Increment boundary i to ${i + 1}.`,
              11,
              swapMarks,
              { i, j, swaps }
            );
          }
          i++;
        }
      }

      // Place pivot into final position
      const temp = arr[i];
      arr[i] = arr[high];
      arr[high] = temp;
      swaps++;
      sortedIndices.add(i);

      const placedMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) placedMarks[idx] = 'sorted';
      placedMarks[i] = 'sorted';

      record(
        `Place pivot ${arr[i]} into its permanent sorted index ${i}. Partition complete.`,
        12,
        placedMarks,
        { pivotIndex: i, pivotValue: arr[i], swaps }
      );

      return i;
    }

    sort(0, arr.length - 1);

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Quicksort complete in ${comparisons} comparisons and ${swaps} swaps.`, 1, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default quickSortDefinition;
