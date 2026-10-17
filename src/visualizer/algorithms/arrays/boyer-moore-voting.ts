/**
 * Boyer-Moore Majority Vote - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const boyerMooreVotingDefinition: AlgoDefinition<number[]> = {
  id: 'boyer-moore-voting',
  name: 'Boyer-Moore Majority Vote',
  category: 'arrays',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Finds the majority element that appears strictly more than n / 2 times in an array using constant O(1) auxiliary space by pairing different elements and canceling them out.',
  pseudocode: [
    'procedure majorityElement(A):',
    '  candidate := null, count := 0',
    '  for each x in A do:',
    '    if count = 0 then candidate := x, count := 1',
    '    else if x = candidate then count := count + 1',
    '    else count := count - 1',
    '  // Verification pass',
    '  if countOccurrences(A, candidate) > length(A) / 2 return candidate',
    '  return null  // no majority element',
  ],
  presets: [
    {
      name: 'clear-majority',
      label: 'Clear Majority (Key 3, 5 of 8)',
      description: 'Element 3 clearly commands majority across sequence.',
      input: [3, 3, 4, 2, 3, 3, 5, 3],
    },
    {
      name: 'tight-majority',
      label: 'Tight Majority (Key 2, 4 of 7)',
      description: 'Element 2 barely clears strictly greater than n/2 threshold.',
      input: [2, 1, 2, 4, 2, 2, 6],
    },
    {
      name: 'no-majority',
      label: 'No Majority Exists',
      description: 'Highest frequency element fails to clear strictly greater than n/2.',
      input: [1, 2, 3, 1, 2, 3, 1],
    },
  ],
  generate(input: number[]): ArrayPointersStep[] {
    const arr = [...input];
    const steps: ArrayPointersStep[] = [];
    const n = arr.length;

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

    if (n === 0) {
      record('Array is empty. No majority element exists.', 9, [], {}, undefined, null);
      return steps;
    }

    let candidate: number | null = null;
    let count = 0;

    record(
      `Initialize Boyer-Moore Voting: candidate = null, count = 0. Array size n=${n}, threshold > ${Math.floor(n / 2)}.`,
      2,
      [{ name: 'i', index: 0, color: 'accent' }],
      {},
      { candidate: 'none', count: 0, threshold: Math.floor(n / 2) }
    );

    // Phase 1: Candidate selection
    for (let i = 0; i < n; i++) {
      const val = arr[i];
      const marks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < i; k++) {
        if (arr[k] === candidate) marks[k] = 'window';
      }
      marks[i] = 'checking';

      if (count === 0) {
        candidate = val;
        count = 1;
        marks[i] = 'found';
        record(
          `Count was 0. Select new candidate = ${candidate} at index ${i}. Reset count := 1.`,
          4,
          [{ name: 'cand', index: i, color: 'accent' }],
          marks,
          { i, val, candidate, count }
        );
      } else if (val === candidate) {
        count++;
        marks[i] = 'window';
        record(
          `A[${i}]=${val} matches current candidate ${candidate}. Increment count to ${count}.`,
          5,
          [{ name: 'match', index: i, color: 'primary' }],
          marks,
          { i, val, candidate, count }
        );
      } else {
        count--;
        marks[i] = 'eliminated';
        record(
          `A[${i}]=${val} ≠ candidate ${candidate}. Decrement count to ${count} (canceling pair).`,
          6,
          [{ name: 'cancel', index: i, color: 'neutral' }],
          marks,
          { i, val, candidate: candidate ?? 'none', count }
        );
      }
    }

    record(
      `Phase 1 complete. Surviving candidate is ${candidate}. Beginning verification pass.`,
      7,
      [],
      {},
      { candidate: candidate ?? 'none', count }
    );

    // Phase 2: Verification pass
    let actualCount = 0;
    const verifyMarks: Record<number, ArrayCellMark> = {};

    for (let i = 0; i < n; i++) {
      if (arr[i] === candidate) {
        actualCount++;
        verifyMarks[i] = 'found';
      } else {
        verifyMarks[i] = 'eliminated';
      }
    }

    const hasMajority = actualCount > Math.floor(n / 2);

    record(
      hasMajority
        ? `Verification confirmed: candidate ${candidate} appears ${actualCount} times (> ${Math.floor(n / 2)}). It is the majority element!`
        : `Verification failed: candidate ${candidate} appears only ${actualCount} times (<= ${Math.floor(n / 2)}). No majority element exists.`,
      hasMajority ? 8 : 9,
      hasMajority ? [{ name: 'majority', index: arr.indexOf(candidate!), color: 'accent' }] : [],
      verifyMarks,
      { candidate: candidate ?? 'none', actualCount, threshold: Math.floor(n / 2), majority: hasMajority },
      hasMajority ? candidate : null
    );

    return steps;
  },
};

export default boyerMooreVotingDefinition;
