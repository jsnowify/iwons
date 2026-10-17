/**
 * Gnome Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateNearlySortedNumbers } from '../../core/inputs';

export const gnomeSortDefinition: AlgoDefinition<number[]> = {
  id: 'gnome-sort',
  name: 'Gnome Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Analogy of a garden gnome sorting flower pots: steps forward if the current pot is in order with the previous one, or swaps them and steps backward if they are out of order.',
  pseudocode: [
    'procedure gnomeSort(A):',
    '  pos := 0',
    '  while pos < length(A) do:',
    '    if pos = 0 or A[pos] >= A[pos - 1] then:',
    '      pos := pos + 1',
    '    else:',
    '      swap(A[pos], A[pos - 1])',
    '      pos := pos - 1',
  ],
  presets: [
    {
      name: 'random-small',
      label: 'Random Array (6 elements)',
      description: 'Clear forward and backward gnome stepping.',
      input: [34, 12, 28, 9, 21, 40],
    },
    {
      name: 'nearly-sorted',
      label: 'Nearly Sorted Array',
      description: 'Gnome steps forward with few backward adjustments.',
      input: generateNearlySortedNumbers(6),
    },
    {
      name: 'descending',
      label: 'Descending Array',
      description: 'Frequent back-steps as gnome shuttles values to front.',
      input: [40, 30, 20, 10],
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

    let pos = 0;
    record('Start Gnome Sort. Gnome stands at position 0.', 2, { 0: 'selected' }, { pos });

    while (pos < arr.length) {
      if (pos === 0) {
        record('Gnome is at index 0. Advance forward to index 1.', 5, { 0: 'selected' }, { pos: 0 });
        pos++;
      } else {
        comparisons++;
        const compMarks: Record<number, 'compared' | 'selected'> = {
          [pos]: 'selected',
          [pos - 1]: 'compared',
        };

        record(`Compare A[${pos}]=${arr[pos]} with previous flower pot A[${pos - 1}]=${arr[pos - 1]}.`, 4, compMarks, {
          pos,
          'A[pos]': arr[pos],
          'A[pos-1]': arr[pos - 1],
          comparisons,
        });

        if (arr[pos] >= arr[pos - 1]) {
          record(`Pots are in order (${arr[pos]} >= ${arr[pos - 1]}). Step forward to index ${pos + 1}.`, 5, {
            [pos]: 'range',
          }, { pos, newPos: pos + 1 });
          pos++;
        } else {
          const temp = arr[pos];
          arr[pos] = arr[pos - 1];
          arr[pos - 1] = temp;
          swaps++;

          const swapMarks: Record<number, 'swapped'> = {
            [pos]: 'swapped',
            [pos - 1]: 'swapped',
          };

          record(
            `Pots out of order (${temp} < ${arr[pos]}). Swap pots and step backward to index ${pos - 1}.`,
            7,
            swapMarks,
            { pos, newPos: pos - 1, swaps }
          );
          pos--;
        }
      }
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Gnome Sort complete in ${comparisons} comparisons and ${swaps} swaps.`, 8, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default gnomeSortDefinition;
