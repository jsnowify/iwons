/**
 * Binary Heap Operations (Insert, Extract-Min, Bubble-Up, Sift-Down) - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode, HeapCell, HeapCellMark, TreeNodeMark } from '../../core/types';

export const binaryHeapOperationsDefinition: AlgoDefinition<number[]> = {
  id: 'binary-heap-operations',
  name: 'Binary Heap Operations',
  category: 'heaps',
  engine: 'tree-heap',
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Maintains a complete binary tree satisfying the Min-Heap property (parent ≤ children) with synchronized 1D array indexing. Demonstrates swim (bubble-up) on insertion and sink (sift-down) on extract-min.',
  pseudocode: [
    'procedure insert(val):',
    '  heap.append(val); idx = heap.length - 1',
    '  while idx > 0 and heap[idx] < heap[parent(idx)]:',
    '    swap(heap[idx], heap[parent(idx)])',
    '    idx = parent(idx)  // bubble-up (swim)',
    'procedure extractMin():',
    '  min = heap[0]; heap[0] = heap.pop()',
    '  idx = 0',
    '  while hasLeftChild(idx):',
    '    smallerChild = minChildIndex(idx)',
    '    if heap[idx] <= heap[smallerChild] then break',
    '    swap(heap[idx], heap[smallerChild])',
    '    idx = smallerChild  // sift-down (sink)',
  ],
  presets: [
    {
      name: 'build-and-extract',
      label: 'Build Heap & Extract Min',
      description: 'Inserts [15, 10, 20, 8, 12, 25, 6] sequentially, then extracts the minimum (6).',
      input: [15, 10, 20, 8, 12, 25, 6],
    },
    {
      name: 'bubble-up-showcase',
      label: 'Bubble-Up (Swim to Root)',
      description: 'Inserts 5 into a heap of larger numbers, swimming from leaf to root.',
      input: [14, 20, 25, 30, 40, 5],
    },
    {
      name: 'single-element',
      label: 'Single Element Heap',
      description: 'Heap with one element.',
      input: [42],
    },
  ],
  generate(input: number[]): TreeHeapStep[] {
    const raw = input && input.length > 0 ? input.slice(0, 15) : [15, 10, 20, 8, 12, 25, 6];
    const steps: TreeHeapStep[] = [];
    const heap: number[] = [];

    // Helper to generate tree node coordinates for complete binary tree
    const getCoordinates = (index: number, total: number) => {
      const depth = Math.floor(Math.log2(index + 1));
      const posInLevel = index - ((1 << depth) - 1);
      const totalInLevel = 1 << depth;
      const levelWidth = 460;
      const startX = 40;
      const slot = levelWidth / totalInLevel;
      const x = Math.round(startX + (posInLevel + 0.5) * slot);
      const y = Math.min(230, depth * 55 + 38);
      return { x, y, depth };
    };

    const record = (
      caption: string,
      line: number,
      activeIdx?: number,
      parentIdx?: number,
      swappedIndices?: [number, number],
      vars?: Record<string, string | number | boolean>
    ) => {
      // Build TreeNode array
      const treeNodes: TreeNode[] = heap.map((val, idx) => {
        const leftIdx = 2 * idx + 1;
        const rightIdx = 2 * idx + 2;
        const { x, y, depth } = getCoordinates(idx, heap.length);

        let mark: TreeNodeMark | undefined = undefined;
        if (swappedIndices && (idx === swappedIndices[0] || idx === swappedIndices[1])) {
          mark = 'inserted';
        } else if (idx === activeIdx) {
          mark = 'current';
        } else if (idx === parentIdx) {
          mark = 'highlight';
        }

        return {
          id: `h_${idx}_${val}`,
          val,
          left: leftIdx < heap.length ? `h_${leftIdx}_${heap[leftIdx]}` : undefined,
          right: rightIdx < heap.length ? `h_${rightIdx}_${heap[rightIdx]}` : undefined,
          x,
          y,
          depth,
          mark,
        };
      });

      // Build HeapCell array for synchronized array view
      const heapArray: HeapCell[] = heap.map((val, idx) => {
        let mark: HeapCellMark | undefined = undefined;
        if (swappedIndices && (idx === swappedIndices[0] || idx === swappedIndices[1])) {
          mark = 'swapped';
        } else if (idx === activeIdx) {
          mark = 'current';
        } else if (idx === parentIdx) {
          mark = 'parent';
        }

        return {
          index: idx,
          val,
          mark,
        };
      });

      steps.push({
        engine: 'tree-heap',
        caption,
        line,
        vars,
        tree: {
          treeNodes,
          rootId: heap.length > 0 ? `h_0_${heap[0]}` : null,
          heapArray,
          callStack: [
            ...(vars?.action ? [{ label: 'operation', args: String(vars.action) }] : []),
            ...(activeIdx !== undefined && activeIdx < heap.length
              ? [{ label: 'active index', args: `[${activeIdx}] = ${heap[activeIdx]}` }]
              : []),
            { label: 'heap size', args: `${heap.length} elements` },
          ],
        },
      });
    };

    record('Initialized empty min-heap. Synchronized tree and array views active.', 1, undefined, undefined, undefined, {
      action: 'Initialize',
    });

    // 1. Insert elements one by one with bubble-up
    for (const val of raw) {
      heap.push(val);
      let idx = heap.length - 1;

      record(
        `Insert ${val} at index [${idx}] (next complete tree leaf).`,
        2,
        idx,
        undefined,
        undefined,
        { action: 'Insert', val, index: idx }
      );

      // Bubble-up (swim)
      while (idx > 0) {
        const pIdx = Math.floor((idx - 1) / 2);
        record(
          `Compare node [${idx}] (${heap[idx]}) with parent [${pIdx}] (${heap[pIdx]}).`,
          3,
          idx,
          pIdx,
          undefined,
          { node: heap[idx], parent: heap[pIdx] }
        );

        if (heap[idx] < heap[pIdx]) {
          const temp = heap[idx];
          heap[idx] = heap[pIdx];
          heap[pIdx] = temp;

          record(
            `Violation: child ${heap[pIdx]} < parent ${heap[idx]}. Swap indices [${idx}] and [${pIdx}].`,
            4,
            pIdx,
            idx,
            [idx, pIdx],
            { action: 'Bubble-Up Swap', child: heap[pIdx], parent: heap[idx] }
          );

          idx = pIdx;
        } else {
          record(
            `Heap property holds: child ${heap[idx]} ≥ parent ${heap[pIdx]}. Bubble-up ends.`,
            5,
            idx,
            pIdx,
            undefined,
            { status: 'In Order' }
          );
          break;
        }
      }
    }

    record(
      `All ${raw.length} keys inserted. Min element at root is ${heap[0]}.`,
      6,
      0,
      undefined,
      undefined,
      { min: heap[0], size: heap.length }
    );

    // 2. Perform Extract-Min if heap has >= 2 elements
    if (heap.length >= 2) {
      const minVal = heap[0];
      const lastVal = heap.pop()!;
      heap[0] = lastVal;

      record(
        `Extract-Min: removed root ${minVal}. Placed last leaf ${lastVal} at root [0]. Begin sift-down.`,
        7,
        0,
        undefined,
        undefined,
        { action: 'Extract-Min', removedMin: minVal, newRoot: lastVal }
      );

      // Sift-down (sink)
      let idx = 0;
      while (2 * idx + 1 < heap.length) {
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        let smaller = left;

        if (right < heap.length && heap[right] < heap[left]) {
          smaller = right;
        }

        record(
          `Compare node [${idx}] (${heap[idx]}) with smaller child [${smaller}] (${heap[smaller]}).`,
          10,
          idx,
          smaller,
          undefined,
          { node: heap[idx], smallerChild: heap[smaller] }
        );

        if (heap[idx] > heap[smaller]) {
          const temp = heap[idx];
          heap[idx] = heap[smaller];
          heap[smaller] = temp;

          record(
            `Violation: parent ${heap[smaller]} > child ${heap[idx]}. Swap indices [${idx}] and [${smaller}].`,
            12,
            smaller,
            idx,
            [idx, smaller],
            { action: 'Sift-Down Swap', parent: heap[smaller], child: heap[idx] }
          );

          idx = smaller;
        } else {
          record(
            `Heap property restored: parent ${heap[idx]} ≤ child ${heap[smaller]}. Sift-down complete.`,
            11,
            idx,
            smaller,
            undefined,
            { status: 'Restored' }
          );
          break;
        }
      }
    }

    record(
      `Binary Heap operations finished. Min-heap invariant fully verified across tree and array.`,
      13,
      heap.length > 0 ? 0 : undefined,
      undefined,
      undefined,
      { status: 'Completed', min: heap[0] ?? 'none' }
    );

    return steps;
  },
};

export default binaryHeapOperationsDefinition;
