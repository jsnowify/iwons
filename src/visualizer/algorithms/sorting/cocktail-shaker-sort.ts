/**
 * Cocktail Shaker Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers } from '../../core/inputs';

export const cocktailShakerSortDefinition: AlgoDefinition<number[]> = {
  id: 'cocktail-shaker-sort',
  name: 'Cocktail Shaker Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Bidirectional variation of bubble sort that traverses both forward (carrying large elements right) and backward (carrying small elements left), solving the turtle problem where small values move slowly.',
  pseudocode: [
    'procedure cocktailShakerSort(A):',
    '  start := 0, end := length(A) - 1, swapped := true',
    '  while swapped do:',
    '    swapped := false',
    '    for i := start to end - 1 do:  // Forward pass',
    '      if A[i] > A[i + 1] swap(A[i], A[i + 1]); swapped := true',
    '    end := end - 1',
    '    if not swapped break',
    '    for i := end - 1 down to start do:  // Backward pass',
    '      if A[i] > A[i + 1] swap(A[i], A[i + 1]); swapped := true',
    '    start := start + 1',
  ],
  presets: [
    {
      name: 'turtles',
      label: 'Turtles Input (Small item at end)',
      description: 'Shows rapid leftward transfer of small elements.',
      input: [20, 30, 40, 50, 60, 70, 80, 5],
    },
    {
      name: 'reversed',
      label: 'Reversed Array',
      description: 'Maximum bidirectional passes.',
      input: generateReversedNumbers(8, 80, 10),
    },
    {
      name: 'nearly-sorted',
      label: 'Nearly Sorted Array',
      description: 'Terminates early after one bidirectional cycle.',
      input: [12, 24, 36, 45, 40, 55, 68, 77],
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
        arr.length === 0 ? 'Array is empty.' : `Single element [${arr[0]}] is sorted.`,
        1,
        arr.length === 1 ? { 0: 'sorted' } : undefined
      );
      return steps;
    }

    record('Start Cocktail Shaker Sort with unsorted array.', 1);

    let start = 0;
    let end = arr.length - 1;
    let swapped = true;

    while (swapped) {
      swapped = false;

      // Forward Pass (left to right)
      record(`Begin forward pass from index ${start} to ${end}.`, 5, getMarks(), { start, end, direction: 'Forward' });

      for (let i = start; i < end; i++) {
        comparisons++;
        const marks = getMarks();
        marks[i] = 'compared';
        marks[i + 1] = 'compared';

        record(`Compare forward neighbours A[${i}]=${arr[i]} and A[${i + 1}]=${arr[i + 1]}.`, 6, marks, {
          i,
          'A[i]': arr[i],
          'A[i+1]': arr[i + 1],
          comparisons,
        });

        if (arr[i] > arr[i + 1]) {
          const temp = arr[i];
          arr[i] = arr[i + 1];
          arr[i + 1] = temp;
          swaps++;
          swapped = true;

          const swapMarks = getMarks();
          swapMarks[i] = 'swapped';
          swapMarks[i + 1] = 'swapped';
          record(`Swap forward: move larger element ${temp} to index ${i + 1}.`, 6, swapMarks, { swaps });
        }
      }

      sortedIndices.add(end);
      end--;

      if (!swapped) break;
      swapped = false;

      // Backward Pass (right to left)
      record(`Begin backward pass from index ${end} down to ${start}.`, 9, getMarks(), {
        start,
        end,
        direction: 'Backward',
      });

      for (let i = end - 1; i >= start; i--) {
        comparisons++;
        const marks = getMarks();
        marks[i] = 'compared';
        marks[i + 1] = 'compared';

        record(`Compare backward neighbours A[${i}]=${arr[i]} and A[${i + 1}]=${arr[i + 1]}.`, 10, marks, {
          i,
          'A[i]': arr[i],
          'A[i+1]': arr[i + 1],
          comparisons,
        });

        if (arr[i] > arr[i + 1]) {
          const temp = arr[i];
          arr[i] = arr[i + 1];
          arr[i + 1] = temp;
          swaps++;
          swapped = true;

          const swapMarks = getMarks();
          swapMarks[i] = 'swapped';
          swapMarks[i + 1] = 'swapped';
          record(`Swap backward: move smaller element ${arr[i]} to index ${i}.`, 10, swapMarks, { swaps });
        }
      }

      sortedIndices.add(start);
      start++;
    }

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Cocktail Shaker Sort complete in ${comparisons} comparisons and ${swaps} swaps.`, 11, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;

    function getMarks(): Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> {
      const m: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) m[idx] = 'sorted';
      return m;
    }
  },
};

export default cocktailShakerSortDefinition;
