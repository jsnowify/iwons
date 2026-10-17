/**
 * Brian Kernighan's Algorithm (Bit Counting & Manipulation) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

export const bitwiseTricksDefinition: AlgoDefinition<number[]> = {
  id: 'bitwise-tricks',
  name: "Brian Kernighan's Bit Counting",
  category: 'bit-manipulation',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(k)',
    worst: 'O(k)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Counts the number of set bits (1s) in a binary integer in O(k) steps (where k is the count of set bits). Uses the bitwise identity n & (n - 1) to extinguish the lowest set bit on every iteration.',
  pseudocode: [
    'procedure countSetBits(n):',
    '  count := 0',
    '  while n > 0 do:',
    '    n := n & (n - 1)  // clear lowest set bit',
    '    count := count + 1',
    '  return count',
  ],
  presets: [
    {
      name: 'number-181',
      label: 'n = 181 (10110101₂)',
      description: 'Binary representation has 5 set bits.',
      input: [181],
    },
    {
      name: 'number-42',
      label: 'n = 42 (00101010₂)',
      description: 'Binary representation has 3 set bits.',
      input: [42],
    },
    {
      name: 'power-of-two-64',
      label: 'n = 64 (01000000₂)',
      description: 'Exact power of two with 1 set bit.',
      input: [64],
    },
  ],
  generate(input: number[]): ArrayPointersStep[] {
    const rawVal = input !== undefined && input.length > 0 ? Math.abs(input[0]) % 256 : 181;
    const steps: ArrayPointersStep[] = [];

    // 8-bit representation: index 0 = bit 7 (MSB), index 7 = bit 0 (LSB)
    const getBits = (val: number): number[] => {
      const bits: number[] = [];
      for (let i = 7; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
      return bits;
    };

    let currentVal = rawVal;
    let count = 0;
    const marks: Record<number, ArrayCellMark> = {};

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      vars?: Record<string, string | number | boolean>
    ) => {
      steps.push({
        engine: 'array-pointers',
        caption,
        line,
        vars,
        array: {
          values: getBits(currentVal),
          pointers,
          marks: { ...marks },
          auxiliaryRow: {
            label: 'Binary State',
            values: [
              `Decimal: ${currentVal}`,
              `Hex: 0x${currentVal.toString(16).toUpperCase()}`,
              `Set Bits Count: ${count}`,
            ],
          },
        },
      });
    };

    record(
      `Initialize n = ${currentVal} (binary ${getBits(currentVal).join('')}₂). Beginning Kernighan's bit count.`,
      1,
      [],
      { n: currentVal, count: 0, binary: getBits(currentVal).join('') }
    );

    if (currentVal === 0) {
      record('n is 0. Total set bits = 0.', 6, [], { count: 0, n: 0 });
      return steps;
    }

    while (currentVal > 0) {
      // Find lowest set bit position (0 to 7 from right, corresponding to array index 7 - bitPos)
      const lowestBit = currentVal & -currentVal;
      const bitPos = Math.log2(lowestBit);
      const arrayIdx = 7 - bitPos;

      marks[arrayIdx] = 'checking';
      record(
        `Identify lowest set bit: 2^${bitPos} = ${lowestBit} (array index [${arrayIdx}]).`,
        3,
        [{ name: 'lowestSetBit', index: arrayIdx, color: 'accent' }],
        { lowestBit, bitPosition: bitPos, count }
      );

      // Perform n & (n - 1)
      const nextVal = currentVal & (currentVal - 1);
      count++;
      marks[arrayIdx] = 'eliminated';

      record(
        `Execute n & (n - 1): ${currentVal} & ${currentVal - 1} = ${nextVal}. Extinguished bit at 2^${bitPos}. Count is now ${count}.`,
        4,
        [{ name: 'cleared', index: arrayIdx, color: 'warning' }],
        { oldN: currentVal, newN: nextVal, count }
      );

      currentVal = nextVal;
    }

    record(
      `Kernighan's bit counting finished! All bits are cleared (n = 0). Total set bits = ${count}.`,
      6,
      [],
      { finalCount: count, n: 0, status: 'Done' }
    );

    return steps;
  },
};

export default bitwiseTricksDefinition;

