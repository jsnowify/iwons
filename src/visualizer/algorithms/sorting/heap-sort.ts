/**
 * Heap Sort - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep } from '../../core/types';
import { generateRandomNumbers, generateReversedNumbers } from '../../core/inputs';

export const heapSortDefinition: AlgoDefinition<number[]> = {
  id: 'heap-sort',
  name: 'Heap Sort',
  category: 'sorting',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Builds a max-heap from the input array in-place, then repeatedly extracts the largest element (root) to the end of the array, restoring the heap property with sift-down.',
  pseudocode: [
    'procedure heapSort(A):',
    '  buildMaxHeap(A)',
    '  for i := length(A) - 1 down to 1 do:',
    '    swap(A[0], A[i])  // move max to end',
    '    siftDown(A, 0, i)',
    'procedure siftDown(A, root, size):',
    '  while leftChild(root) < size do:',
    '    largest := root',
    '    if left < size and A[left] > A[largest] largest := left',
    '    if right < size and A[right] > A[largest] largest := right',
    '    if largest != root swap(A[root], A[largest]); root := largest else break',
  ],
  presets: [
    {
      name: 'random',
      label: 'Random Array (8 elements)',
      description: 'Standard heap build and extract cycles.',
      input: [4, 10, 3, 5, 1, 15, 8, 2],
    },
    {
      name: 'reversed',
      label: 'Reversed Array',
      description: 'Already resembles a max-heap, tests fast build.',
      input: generateReversedNumbers(8, 80, 10),
    },
    {
      name: 'ten',
      label: '10 Elements',
      description: 'Complete 3-level binary heap tree.',
      input: generateRandomNumbers(10, 5, 95, 707),
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

    record('Start Heap Sort. Phase 1: Build max-heap.', 2);

    const n = arr.length;

    function siftDown(root: number, size: number) {
      let curr = root;
      while (2 * curr + 1 < size) {
        let largest = curr;
        const left = 2 * curr + 1;
        const right = 2 * curr + 2;

        comparisons++;
        if (arr[left] > arr[largest]) largest = left;
        if (right < size) {
          comparisons++;
          if (arr[right] > arr[largest]) largest = right;
        }

        if (largest !== curr) {
          const temp = arr[curr];
          arr[curr] = arr[largest];
          arr[largest] = temp;
          swaps++;

          const marks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
          for (const idx of sortedIndices) marks[idx] = 'sorted';
          marks[curr] = 'swapped';
          marks[largest] = 'swapped';

          record(
            `Sift down: Swap parent ${temp} at index ${curr} with larger child ${arr[curr]} at index ${largest}.`,
            11,
            marks,
            { curr, largest, parentVal: arr[curr], childVal: arr[largest], size }
          );

          curr = largest;
        } else {
          break;
        }
      }
    }

    // Build max heap bottom-up
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      record(`Heapify subtree rooted at index ${i} (value ${arr[i]}).`, 2, { [i]: 'pivot' }, { root: i });
      siftDown(i, n);
    }

    record('Phase 1 complete. Array represents valid max-heap where root A[0] is maximum.', 2, { 0: 'pivot' });

    // Extract elements one by one
    for (let i = n - 1; i > 0; i--) {
      // Swap root with end of heap
      const temp = arr[0];
      arr[0] = arr[i];
      arr[i] = temp;
      swaps++;
      sortedIndices.add(i);

      const extractMarks: Record<number, 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected'> = {};
      for (const idx of sortedIndices) extractMarks[idx] = 'sorted';
      extractMarks[0] = 'swapped';
      extractMarks[i] = 'sorted';

      record(
        `Extract maximum ${arr[i]} from root to index ${i}. Shrink active heap to size ${i}.`,
        4,
        extractMarks,
        { extractedVal: arr[i], targetIndex: i, remainingHeapSize: i }
      );

      siftDown(0, i);
    }

    sortedIndices.add(0);
    const finalMarks: Record<number, 'sorted'> = {};
    for (let k = 0; k < arr.length; k++) finalMarks[k] = 'sorted';

    record(`Heap Sort complete in ${comparisons} comparisons and ${swaps} swaps.`, 1, finalMarks, {
      comparisons,
      swaps,
      status: 'Sorted',
    });

    return steps;
  },
};

export default heapSortDefinition;

