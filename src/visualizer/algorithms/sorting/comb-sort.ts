/**
 * Comb Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers } from '../../core/inputs';

export const combSortDefinition: AlgoDefinition<number[]> = {
  id: 'comb-sort',
  name: 'Comb Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n² / 2^p)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Improves on bubble sort by comparing elements separated by a gap that shrinks by a factor of 1.3 on each iteration until reaching a final gap of 1.',
  pseudocode: [
    'procedure combSort(A):',
    '  gap := length(A)',
    '  shrink := 1.3, sorted := false',
    '  while not sorted do:',
    '    gap := floor(gap / shrink)',
    '    if gap <= 1 then gap := 1; sorted := true',
    '    for i := 0 to length(A) - gap - 1 do:',
    '      if A[i] > A[i + gap] then:',
    '        swap(A[i], A[i + gap]); sorted := false',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Rapid elimination of inversions using shrink factor 1.3.',
      input: [84, 23, 62, 44, 16, 95, 52, 38],
    },
    {
      name: 'reversed',
      label: 'Reversed Array',
      description: 'Worst-case inversion profile resolved quickly by large gaps.',
      input: generateReversedNumbers(8, 80, 10),
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

    let gap = arr.length;
    const shrink = 1.3;
    let sorted = false;

    record('Start Comb Sort. Initial gap equals array length.', 1);

    while (!sorted) {
      gap = Math.floor(gap / shrink);
      if (gap <= 1) {
        gap = 1;
        sorted = true;
      }

      record(`Shrink gap to ${gap}. Begin pass across pairs separated by ${gap}.`, 4, undefined, { gap });

      for (let i = 0; i < arr.length - gap; i++) {
        comparisons++;
        const compMarks: Record<number, 'compared' | 'swapped' | 'selected'> = {
          [i]: 'compared',
          [i + gap]: 'compared',
        };

        record(`Compare comb pair A[${i}]=${arr[i]} and A[${i + gap}]=${arr[i + gap]} (gap ${gap}).`, 8, compMarks, {
          i,
          'A[i]': arr[i],
          'A[i+gap]': arr[i + gap],
          gap,
          comparisons,
        });

        if (arr[i] > arr[i + gap]) {
          const temp = arr[i];
          arr[i] = arr[i + gap];
          arr[i + gap] = temp;
          swaps++;
          sorted = false;

          const swapMarks: Record<number, 'swapped'> = {
            [i]: 'swapped',
            [i + gap]: 'swapped',
          };
          record(`Swap pair ${temp} and ${arr[i]} across gap ${gap}.`, 9, swapMarks, { gap, swaps });
        }
      }
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Comb Sort complete in ${comparisons} comparisons and ${swaps} swaps.`, 6, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default combSortDefinition;
