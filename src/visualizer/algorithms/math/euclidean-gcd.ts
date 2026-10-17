/**
 * Euclidean Algorithm for Greatest Common Divisor (GCD) - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep, BarMark } from '../../core/types';

export const euclideanGcdDefinition: AlgoDefinition<number[]> = {
  id: 'euclidean-gcd',
  name: 'Euclidean Algorithm (GCD)',
  category: 'math',
  engine: 'bars',
  complexity: {
    best: 'O(1)',
    average: 'O(log(min(a, b)))',
    worst: 'O(log(min(a, b)))',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Computes the greatest common divisor of two integers by repeatedly replacing the larger number with the remainder of dividing the larger by the smaller until the remainder is zero.',
  pseudocode: [
    'procedure gcd(a, b):',
    '  while b != 0 do:',
    '    remainder = a mod b',
    '    a = b',
    '    b = remainder',
    '  return a  // Greatest Common Divisor',
  ],
  presets: [
    {
      name: 'standard-48-18',
      label: 'GCD(48, 18) = 6',
      description: 'Classic textbook example: 48 mod 18 = 12, 18 mod 12 = 6, 12 mod 6 = 0.',
      input: [48, 18],
    },
    {
      name: 'coprime-35-12',
      label: 'Coprime Numbers GCD(35, 12) = 1',
      description: 'Two numbers sharing no common factor other than 1.',
      input: [35, 12],
    },
    {
      name: 'multi-step-252-105',
      label: 'Multi-Step GCD(252, 105) = 21',
      description: 'Demonstrates shrinkage across multiple Euclidean divisions.',
      input: [252, 105],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const raw = input !== undefined && input.length >= 2 ? input : [48, 18];
    const steps: BarsStep[] = [];

    let a = Math.max(1, Math.abs(raw[0]));
    let b = Math.max(0, Math.abs(raw[1]));

    // Ensure a >= b initially
    if (b > a) {
      const temp = a;
      a = b;
      b = temp;
    }

    const initialA = a;
    const initialB = b;
    let stepCount = 0;

    const record = (
      caption: string,
      line: number,
      currentA: number,
      currentB: number,
      aMark?: BarMark,
      bMark?: BarMark,
      vars?: Record<string, string | number | boolean>
    ) => {
      const marks: Record<number, BarMark> = {};
      if (aMark) marks[0] = aMark;
      if (bMark) marks[1] = bMark;

      steps.push({
        engine: 'bars',
        caption,
        line,
        vars,
        bars: {
          values: [currentA, currentB],
          marks,
          counters: {
            comparisons: stepCount,
            swaps: 0,
          },
        },
      });
    };

    record(
      `Initialize Euclidean algorithm for GCD(${initialA}, ${initialB}).`,
      1,
      a,
      b,
      'compared',
      'compared',
      { a, b, step: 0 }
    );

    while (b !== 0) {
      stepCount++;
      const quotient = Math.floor(a / b);
      const remainder = a % b;

      record(
        `Step ${stepCount}: divide ${a} by ${b} → quotient = ${quotient}, remainder = ${a} mod ${b} = ${remainder}. (${a} = ${quotient} × ${b} + ${remainder})`,
        3,
        a,
        b,
        'compared',
        'swapped',
        { a, b, quotient, remainder, step: stepCount }
      );

      a = b;
      b = remainder;

      record(
        `Update values: a := ${a}, b := ${b}.`,
        4,
        a,
        b,
        undefined,
        b === 0 ? 'sorted' : undefined,
        { a, b, step: stepCount }
      );
    }

    record(
      `Algorithm finished! b is 0. The Greatest Common Divisor is GCD(${initialA}, ${initialB}) = ${a}.`,
      6,
      a,
      0,
      'sorted',
      undefined,
      { gcd: a, initialA, initialB, totalSteps: stepCount }
    );

    return steps;
  },
};

export default euclideanGcdDefinition;

