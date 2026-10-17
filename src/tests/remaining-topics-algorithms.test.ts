import { describe, it, expect } from 'vitest';
import activitySelectionDefinition from '../visualizer/algorithms/greedy/activity-selection';
import fractionalKnapsackDefinition from '../visualizer/algorithms/greedy/fractional-knapsack';
import euclideanGcdDefinition from '../visualizer/algorithms/math/euclidean-gcd';
import sieveOfEratosthenesDefinition from '../visualizer/algorithms/math/sieve-of-eratosthenes';
import bitwiseTricksDefinition from '../visualizer/algorithms/bits/bitwise-tricks';
import { loadAlgorithmDefinition } from '../visualizer/registry';
import { ArrayPointersStep, BarsStep, GridTableStep } from '../visualizer/core/types';

describe('Phase V9: Remaining Topics Algorithms (Greedy, Math, Bits)', () => {
  describe('Registry Dynamic Import Integration', () => {
    it('successfully loads all 5 Remaining Topics algorithm definitions via registry', async () => {
      const ids = [
        'activity-selection',
        'fractional-knapsack',
        'euclidean-gcd',
        'sieve-of-eratosthenes',
        'bitwise-tricks',
      ];

      for (const id of ids) {
        const def = await loadAlgorithmDefinition(id);
        expect(def, `Algorithm ${id} should load successfully`).not.toBeNull();
        expect(def?.id).toBe(id);
        expect(typeof def?.generate).toBe('function');
      }
    });
  });

  describe('Algorithm 1: Greedy Activity Selection', () => {
    it('selects mutually compatible activities with zero overlaps', () => {
      // Pairs of [start, finish]: [1,4], [3,5], [0,6], [5,7], [3,8], [5,9]
      const input = [1, 4, 3, 5, 0, 6, 5, 7, 3, 8, 5, 9];
      const steps = activitySelectionDefinition.generate(input) as ArrayPointersStep[];
      expect(steps.length).toBeGreaterThan(5);

      const finalStep = steps[steps.length - 1];
      const selected = finalStep.array.auxiliaryRow?.values as string[];
      expect(selected).toBeDefined();
      expect(selected.length).toBeGreaterThanOrEqual(2);

      // Verify each selected activity interval [s, f] satisfies s_j >= f_i
      const intervals = selected.map(s => {
        const match = s.match(/\[(\d+)-(\d+)\]/);
        return { start: Number(match![1]), finish: Number(match![2]) };
      });

      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i].start).toBeGreaterThanOrEqual(intervals[i - 1].finish);
      }
    });
  });

  describe('Algorithm 2: Fractional Knapsack', () => {
    it('achieves mathematical optimum against independent knapsack oracle', () => {
      // 3 items: [val, wt] = [60, 10], [100, 20], [120, 30], capacity 50
      // Ratios: 6.0, 5.0, 4.0
      // Optimal: 60 (10kg) + 100 (20kg) + 80 (20/30 of 120) = 240
      const input = [60, 10, 100, 20, 120, 30];
      const steps = fractionalKnapsackDefinition.generate(input) as BarsStep[];
      expect(steps.length).toBeGreaterThan(4);

      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.optimalValue).toBe(240);
      expect(finalStep.vars?.packedWeight).toBe(50);
    });
  });

  describe('Algorithm 3: Euclidean GCD', () => {
    function oracleGcd(a: number, b: number): number {
      while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      return a;
    }

    it('matches independent Euclidean division oracle across test pairs', () => {
      const testCases = [
        [48, 18],
        [35, 12],
        [252, 105],
        [100, 25],
        [17, 17],
      ];

      for (const [a, b] of testCases) {
        const steps = euclideanGcdDefinition.generate([a, b]) as BarsStep[];
        const finalStep = steps[steps.length - 1];
        const expected = oracleGcd(a, b);
        expect(finalStep.vars?.gcd).toBe(expected);
      }
    });
  });

  describe('Algorithm 4: Sieve of Eratosthenes', () => {
    function oracleIsPrime(num: number): boolean {
      if (num < 2) return false;
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
      }
      return true;
    }

    it('identifies exact prime numbers on 6x6 grid up to 36', () => {
      const steps = sieveOfEratosthenesDefinition.generate([36]) as GridTableStep[];
      expect(steps.length).toBeGreaterThan(10);

      const finalStep = steps[steps.length - 1];
      const cells = finalStep.grid.cells;

      // Exactly 11 primes under 36: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31
      const primeCells = cells.filter(c => c.mark === 'computed' || c.mark === 'candidate');
      const primeValues = primeCells.map(c => Number(c.value)).sort((a, b) => a - b);

      const expectedPrimes: number[] = [];
      for (let i = 1; i <= 36; i++) {
        if (oracleIsPrime(i)) expectedPrimes.push(i);
      }

      expect(primeValues).toEqual(expectedPrimes);

      // Number 1 is marked as wall (non-prime)
      const cell1 = cells.find(c => c.value === 1);
      expect(cell1?.mark).toBe('wall');

      // Composites (e.g. 4, 6, 8, 9, 10, ...) are marked as wall
      const cell4 = cells.find(c => c.value === 4);
      expect(cell4?.mark).toBe('wall');
    });
  });

  describe("Algorithm 5: Brian Kernighan's Bit Counting", () => {
    function oraclePopCount(val: number): number {
      return (val >>> 0).toString(2).replace(/0/g, '').length;
    }

    it('matches exact popcount across binary numbers', () => {
      const numbers = [181, 42, 64, 255, 0, 7];

      for (const n of numbers) {
        const steps = bitwiseTricksDefinition.generate([n]) as ArrayPointersStep[];
        const finalStep = steps[steps.length - 1];
        const expected = oraclePopCount(n);
        expect(finalStep.vars?.finalCount ?? finalStep.vars?.count).toBe(expected);
      }
    });
  });
});

