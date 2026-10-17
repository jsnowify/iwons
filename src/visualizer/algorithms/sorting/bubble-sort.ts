/**
 * Bubble Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateRandomNumbers, generateReversedNumbers, generateSortedNumbers } from '../../core/inputs';

export const bubbleSortDefinition: AlgoDefinition<number[]> = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Steps through the list repeatedly, compares adjacent elements and swaps them if they are out of order until no swaps are needed.',
  pseudocode: [
    'procedure bubbleSort(A):',
    '  n := length(A)',
    '  repeat',
    '    swapped := false',
    '    for i := 0 to n - 2 do:',
    '      if A[i] > A[i + 1] then:',
    '        swap(A[i], A[i + 1])',
    '        swapped := true',
    '    n := n - 1',
    '  until not swapped',
  ],
  presets: [
    {
      name: 'random-small',
      label: 'Random (8 elements)',
      description: 'Typical unsorted input array.',
      input: [45, 12, 85, 32, 89, 39, 69, 44],
    },
    {
      name: 'reversed',
      label: 'Worst Case (Reversed)',
      description: 'Elements in descending order, requires maximum comparisons and swaps.',
      input: generateReversedNumbers(8, 80, 10),
    },
    {
      name: 'nearly-sorted',
      label: 'Best Case (Nearly Sorted)',
      description: 'Almost sorted array requiring minimal passes.',
      input: [10, 20, 25, 40, 35, 50, 60, 70],
    },
    {
      name: 'already-sorted',
      label: 'Already Sorted',
      description: 'Array already in order; terminates in O(n) on first pass.',
      input: generateSortedNumbers(7, 10, 10),
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
        arr.length === 0 ? 'Array is empty; already sorted.' : `Single element [${arr[0]}] is already sorted.`,
        1,
        arr.length === 1 ? { 0: 'sorted' } : undefined
      );
      return steps;
    }

    record('Start Bubble Sort with unsorted array.', 1);

    const sortedIndices = new Set<number>();
    let n = arr.length;
    let swapped = false;

    do {
      swapped = false;
      record(`Begin pass with right boundary at index ${n - 1}.`, 3, getMarks());

      for (let i = 0; i < n - 1; i++) {
        comparisons++;
        const marks = getMarks();
        marks[i] = 'compared';
        marks[i + 1] = 'compared';

        record(
          `Compare neighbours A[${i}]=${arr[i]} and A[${i + 1}]=${arr[i + 1]}.`,
          6,
          marks,
          { i, 'A[i]': arr[i], 'A[i+1]': arr[i + 1], comparisons, swaps }
        );

        if (arr[i] > arr[i + 1]) {
          const temp = arr[i];
          arr[i] = arr[i + 1];
          arr[i + 1] = temp;
          swaps++;
          swapped = true;

          const swapMarks = getMarks();
          swapMarks[i] = 'swapped';
          swapMarks[i + 1] = 'swapped';

          record(
            `Swap ${temp} and ${arr[i]} because ${temp} > ${arr[i]}.`,
            7,
            swapMarks,
            { i, 'A[i]': arr[i], 'A[i+1]': arr[i + 1], comparisons, swaps }
          );
        }
      }

      sortedIndices.add(n - 1);
      n--;
      record(
        `Pass finished. Element at index ${n} has bubbled to its final position.`,
        9,
        getMarks(),
        { n, swapped, comparisons, swaps }
      );
    } while (swapped && n > 1);

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(
      `Sorting complete in ${comparisons} comparisons and ${swaps} swaps.`,
      10,
      finalMarks,
      { comparisons, swaps, status: 'Sorted' }
    );

    return steps;

    function getMarks(): Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> {
      const marks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) {
        marks[idx] = 'sorted';
      }
      return marks;
    }
  },
};

export default bubbleSortDefinition;

