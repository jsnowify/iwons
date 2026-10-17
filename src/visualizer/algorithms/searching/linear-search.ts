/**
 * Linear Search - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const linearSearchDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'linear-search',
  name: 'Linear Search',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Sequentially checks each element of the list from left to right until a match is found or the end of the collection is reached.',
  pseudocode: [
    'procedure linearSearch(A, target):',
    '  for i := 0 to length(A) - 1 do:',
    '    if A[i] = target then:',
    '      return i  // match found',
    '  return -1  // target not found',
  ],
  presets: [
    {
      name: 'found-middle',
      label: 'Target in Middle (Find 42)',
      description: 'Finds target halfway through the sequence.',
      input: { target: 42, numbers: [12, 5, 87, 42, 19, 63, 31] },
    },
    {
      name: 'found-first',
      label: 'Best Case (Find 10 at Index 0)',
      description: 'Target located on the very first comparison.',
      input: { target: 10, numbers: [10, 24, 76, 33, 91, 5] },
    },
    {
      name: 'absent',
      label: 'Target Absent (Find 99)',
      description: 'Scans the entire list before confirming target is missing.',
      input: { target: 99, numbers: [14, 28, 35, 49, 63, 77] },
    },
  ],
  generate(input: TargetAndNumbers): ArrayPointersStep[] {
    const arr = [...input.numbers];
    const target = input.target;
    const steps: ArrayPointersStep[] = [];

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      marks?: Record<number, ArrayCellMark>,
      vars?: Record<string, string | number | boolean>,
      result?: string | number | boolean | null
    ) => {
      steps.push({
        engine: 'array-pointers',
        caption,
        line,
        vars,
        array: {
          values: [...arr],
          pointers,
          marks,
          result,
        },
      });
    };

    if (arr.length === 0) {
      record(`Array is empty. Target ${target} not found.`, 4, [], {}, { target }, -1);
      return steps;
    }

    record(
      `Initialize linear scan for target ${target} across ${arr.length} elements.`,
      1,
      [{ name: 'i', index: 0, color: 'accent' }],
      {},
      { target, length: arr.length }
    );

    const pastMarks: Record<number, ArrayCellMark> = {};

    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      const currentMarks: Record<number, ArrayCellMark> = { ...pastMarks, [i]: 'checking' };

      record(
        `Inspect index ${i}: A[${i}] = ${val}. Compare with target ${target}.`,
        2,
        [{ name: 'i', index: i, color: 'accent' }],
        currentMarks,
        { i, 'A[i]': val, target }
      );

      if (val === target) {
        currentMarks[i] = 'found';
        record(
          `Match found! A[${i}] equals ${target}. Returning index ${i}.`,
          3,
          [{ name: 'i', index: i, color: 'accent' }],
          currentMarks,
          { i, 'A[i]': val, target, result: i },
          i
        );
        return steps;
      }

      pastMarks[i] = 'eliminated';
      record(
        `A[${i}] (${val}) ≠ ${target}. Advance pointer to next element.`,
        1,
        [{ name: 'i', index: i, color: 'neutral' }],
        pastMarks,
        { i, 'A[i]': val, target }
      );
    }

    record(
      `Scanned all ${arr.length} elements without finding target ${target}. Return -1.`,
      4,
      [],
      pastMarks,
      { target, result: -1 },
      -1
    );

    return steps;
  },
};

export default linearSearchDefinition;
