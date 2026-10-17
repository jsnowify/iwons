/**
 * Pancake Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateReversedNumbers } from '../../core/inputs';

export const pancakeSortDefinition: AlgoDefinition<number[]> = {
  id: 'pancake-sort',
  name: 'Pancake Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Sorts an array using only prefix reversals (spatula flips): finds the largest unsorted element, flips it to the top (index 0), and flips the entire unsorted prefix to place it at the back.',
  pseudocode: [
    'procedure pancakeSort(A):',
    '  for currSize := length(A) down to 2 do:',
    '    maxIdx := findMax(A, currSize)',
    '    if maxIdx != currSize - 1 then:',
    '      if maxIdx != 0 then flip(A, maxIdx)  // bring max to top',
    '      flip(A, currSize - 1)  // flip max into final position',
    'procedure flip(A, k): reverse A[0..k]',
  ],
  presets: [
    {
      name: 'random-small',
      label: 'Random Stack (6 pancakes)',
      description: 'Finds largest pancake and flips to position.',
      input: [28, 54, 12, 85, 33, 40],
    },
    {
      name: 'reversed',
      label: 'Inverted Stack',
      description: 'Single full flip sorts the stack.',
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

    record('Start Pancake Sort. Elements will be sorted using prefix flips only.', 1);

    function flip(k: number) {
      let left = 0;
      let right = k;
      while (left < right) {
        const temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        swaps++;
        left++;
        right--;
      }
    }

    for (let currSize = arr.length; currSize > 1; currSize--) {
      // Find index of maximum element in arr[0..currSize - 1]
      let maxIdx = 0;
      for (let i = 1; i < currSize; i++) {
        comparisons++;
        if (arr[i] > arr[maxIdx]) maxIdx = i;
      }

      const activeMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) activeMarks[idx] = 'sorted';
      for (let k = 0; k < currSize; k++) activeMarks[k] = 'range';
      activeMarks[maxIdx] = 'selected';

      record(
        `Largest pancake in active stack [0..${currSize - 1}] is ${arr[maxIdx]} at index ${maxIdx}.`,
        3,
        activeMarks,
        { currSize, maxIdx, maxVal: arr[maxIdx] }
      );

      if (maxIdx !== currSize - 1) {
        // Step 1: Flip to top if not already at top
        if (maxIdx !== 0) {
          flip(maxIdx);
          const flipTopMarks = { ...activeMarks };
          flipTopMarks[0] = 'swapped';
          flipTopMarks[maxIdx] = 'swapped';

          record(
            `Flip top ${maxIdx + 1} pancakes (range [0..${maxIdx}]). Max pancake ${arr[0]} is now at top index 0.`,
            5,
            flipTopMarks,
            { flipRange: maxIdx, flips: swaps }
          );
        }

        // Step 2: Flip entire active prefix to send max pancake to position currSize - 1
        flip(currSize - 1);
        sortedIndices.add(currSize - 1);

        const flipBottomMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
        for (const idx of sortedIndices) flipBottomMarks[idx] = 'sorted';
        flipBottomMarks[currSize - 1] = 'sorted';

        record(
          `Flip active prefix [0..${currSize - 1}]. Max pancake ${arr[currSize - 1]} is now in place at index ${currSize - 1}.`,
          6,
          flipBottomMarks,
          { placedAt: currSize - 1, flips: swaps }
        );
      } else {
        sortedIndices.add(currSize - 1);
        record(`Pancake at index ${currSize - 1} is already in its final position.`, 4, {
          [currSize - 1]: 'sorted',
        });
      }
    }

    for (let k = 0; k < arr.length; k++) sortedIndices.add(k);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Pancake Sort complete in ${comparisons} comparisons and ${swaps} spatula reversals.`, 1, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default pancakeSortDefinition;

