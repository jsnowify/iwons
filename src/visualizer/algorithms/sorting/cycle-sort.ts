/**
 * Cycle Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers } from '../../core/inputs';

export const cycleSortDefinition: AlgoDefinition<number[]> = {
  id: 'cycle-sort',
  name: 'Cycle Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'In-place unstable sorting algorithm optimal in terms of total writes to memory: decomposes the permutation into cycles and rotates elements directly into their final positions, writing each value at most twice.',
  pseudocode: [
    'procedure cycleSort(A):',
    '  for cycleStart := 0 to length(A) - 2 do:',
    '    item := A[cycleStart]',
    '    pos := cycleStart',
    '    for i := cycleStart + 1 to length(A) - 1 do:  // count smaller elements',
    '      if A[i] < item then pos := pos + 1',
    '    while pos != cycleStart do:  // rotate cycle',
    '      swap(item, A[pos])',
  ],
  presets: [
    {
      name: 'random-small',
      label: 'Random Array (6 elements)',
      description: 'Clear decomposition into permutation cycles.',
      input: [35, 12, 48, 20, 9, 27],
    },
    {
      name: 'reversed',
      label: 'Reversed Array',
      description: 'All elements belong to inversion cycles.',
      input: generateReversedNumbers(6, 60, 10),
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

    const n = arr.length;
    record('Start Cycle Sort. Goal: Minimize array writes by rotating permutation cycles.', 1);

    for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
      let item = arr[cycleStart];
      let pos = cycleStart;

      record(`Begin cycle starting at index ${cycleStart} with item ${item}.`, 3, {
        [cycleStart]: 'selected',
      }, { cycleStart, item });

      // Find where to put the item
      for (let i = cycleStart + 1; i < n; i++) {
        comparisons++;
        if (arr[i] < item) pos++;
      }

      if (pos === cycleStart) {
        sortedIndices.add(cycleStart);
        record(`Item ${item} is already in its correct sorted position at index ${cycleStart}.`, 5, {
          [cycleStart]: 'sorted',
        });
        continue;
      }

      // Skip duplicates
      while (item === arr[pos]) pos++;

      // Put item into position
      if (pos !== cycleStart) {
        const temp = arr[pos];
        arr[pos] = item;
        item = temp;
        swaps++;
        sortedIndices.add(pos);

        record(`Rotate item into target position ${pos}. Displaced element is ${item}.`, 8, {
          [pos]: 'swapped',
          [cycleStart]: 'selected',
        }, { pos, item, memoryWrites: swaps });
      }

      // Rotate rest of the cycle
      while (pos !== cycleStart) {
        pos = cycleStart;
        for (let i = cycleStart + 1; i < n; i++) {
          comparisons++;
          if (arr[i] < item) pos++;
        }
        while (item === arr[pos]) pos++;

        if (item !== arr[pos]) {
          const temp = arr[pos];
          arr[pos] = item;
          item = temp;
          swaps++;
          sortedIndices.add(pos);

          record(`Continue cycle: write ${arr[pos]} at index ${pos}. Displaced ${item}.`, 8, {
            [pos]: 'swapped',
          }, { pos, item, memoryWrites: swaps });
        }
      }

      sortedIndices.add(cycleStart);
    }

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Cycle Sort complete in ${comparisons} comparisons and only ${swaps} memory writes.`, 8, finalMarks, {
      comparisons,
      memoryWrites: swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default cycleSortDefinition;
