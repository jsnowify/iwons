/**
 * Tim Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';

export const timSortDefinition: AlgoDefinition<number[]> = {
  id: 'tim-sort',
  name: 'Tim Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Hybrid stable sorting algorithm combining insertion sort on small runs (e.g. size 4) and merge sort to combine runs efficiently, widely used in Python and Java standard libraries.',
  pseudocode: [
    'procedure timSort(A, RUN):',
    '  n := length(A)',
    '  for i := 0 to n - 1 step RUN do:',
    '    insertionSort(A, i, min(i + RUN - 1, n - 1))',
    '  size := RUN',
    '  while size < n do:',
    '    for left := 0 to n - 1 step 2 * size do:',
    '      merge(A, left, mid, right)',
    '    size := 2 * size',
  ],
  presets: [
    {
      name: 'eight-elements',
      label: '8 Elements (Run size 4)',
      description: 'Sorts two runs of 4 with insertion sort, then merges them.',
      input: [42, 17, 35, 8, 99, 61, 23, 74],
    },
    {
      name: 'descending',
      label: 'Inverted Runs',
      description: 'Reverses within runs and merges.',
      input: [50, 40, 30, 20, 80, 70, 60, 10],
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

    const n = arr.length;
    const RUN = 4;

    record(`Start Tim Sort with fixed run size RUN = ${RUN}.`, 1, undefined, { RUN, n });

    // Phase 1: Insertion sort each RUN
    for (let i = 0; i < n; i += RUN) {
      const end = Math.min(i + RUN - 1, n - 1);
      record(`Phase 1: Sort run [${i}..${end}] using insertion sort.`, 4, { [i]: 'range', [end]: 'range' }, {
        runStart: i,
        runEnd: end,
      });

      for (let j = i + 1; j <= end; j++) {
        const key = arr[j];
        let k = j - 1;

        while (k >= i) {
          comparisons++;
          if (arr[k] > key) {
            arr[k + 1] = arr[k];
            swaps++;
            k--;
          } else {
            break;
          }
        }
        arr[k + 1] = key;
      }

      const runMarks: Record<number, 'sorted'> = {};
      for (let r = i; r <= end; r++) runMarks[r] = 'sorted';
      record(`Run [${i}..${end}] is now sorted.`, 4, runMarks);
    }

    // Phase 2: Merge sorted runs
    for (let size = RUN; size < n; size *= 2) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);

        if (mid < right) {
          record(`Phase 2: Merge adjacent sorted runs [${left}..${mid}] and [${mid + 1}..${right}].`, 8, {
            [left]: 'range',
            [mid]: 'selected',
            [right]: 'range',
          }, { left, mid, right, size });

          // Merge subroutine
          const leftHalf = arr.slice(left, mid + 1);
          const rightHalf = arr.slice(mid + 1, right + 1);

          let p1 = 0, p2 = 0, curr = left;
          while (p1 < leftHalf.length && p2 < rightHalf.length) {
            comparisons++;
            if (leftHalf[p1] <= rightHalf[p2]) {
              arr[curr++] = leftHalf[p1++];
            } else {
              arr[curr++] = rightHalf[p2++];
            }
            swaps++;
          }
          while (p1 < leftHalf.length) {
            arr[curr++] = leftHalf[p1++];
            swaps++;
          }
          while (p2 < rightHalf.length) {
            arr[curr++] = rightHalf[p2++];
            swaps++;
          }
        }
      }
    }

    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Tim Sort complete in ${comparisons} comparisons and ${swaps} operations.`, 9, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default timSortDefinition;
