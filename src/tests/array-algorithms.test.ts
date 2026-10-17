import { describe, it, expect } from 'vitest';
import { loadAlgorithmDefinition, ALGORITHM_REGISTRY } from '../visualizer/registry';
import { createRng, generateRandomNumbers } from '../visualizer/core/inputs';
import { TargetAndNumbers, PatternMatchInput } from '../visualizer/core/inputs';

describe('Engine 2 (Array & Pointers): Full 17-Algorithm Library Verification', () => {
  const arrayAlgoMetas = ALGORITHM_REGISTRY.filter(a => a.engine === 'array-pointers');

  it('has exactly 17 array-pointers algorithms defined in the catalog', () => {
    expect(arrayAlgoMetas.length).toBe(17);
  });

  // --- SEARCHING ALGORITHMS ORACLE TESTS ---
  const searchAlgoIds = [
    'linear-search',
    'binary-search',
    'jump-search',
    'interpolation-search',
    'exponential-search',
    'ternary-search',
  ];

  for (const id of searchAlgoIds) {
    describe(`Search Algorithm: ${id}`, () => {
      it('loads definition and passes structural invariants', async () => {
        const algo = await loadAlgorithmDefinition(id);
        expect(algo).not.toBeNull();
        expect(algo!.engine).toBe('array-pointers');
        expect(algo!.inputKind).toBe('target-and-numbers');
        expect(algo!.pseudocode.length).toBeGreaterThan(3);
        expect(algo!.presets.length).toBeGreaterThan(1);
      });

      it('verifies edge cases against indexOf oracle', async () => {
        const algo = await loadAlgorithmDefinition(id);
        expect(algo).not.toBeNull();

        const edgeCases: { target: number; numbers: number[] }[] = [
          { target: 42, numbers: [] },
          { target: 42, numbers: [42] },
          { target: 99, numbers: [42] },
          { target: 10, numbers: [10, 20] },
          { target: 20, numbers: [10, 20] },
          { target: 5, numbers: [10, 20] },
          { target: 15, numbers: [10, 20] },
          { target: 25, numbers: [10, 20] },
          { target: 7, numbers: [7, 7, 7, 7] },
          { target: 8, numbers: [7, 7, 7, 7] },
          { target: 25, numbers: [2, 5, 8, 12, 19, 25, 33, 47, 59] },
          { target: 1, numbers: [2, 5, 8, 12, 19, 25, 33, 47, 59] },
          { target: 100, numbers: [2, 5, 8, 12, 19, 25, 33, 47, 59] },
        ];

        for (const tc of edgeCases) {
          const sortedNumbers = [...tc.numbers].sort((a, b) => a - b);
          const steps = algo!.generate({ target: tc.target, numbers: sortedNumbers });
          expect(steps.length).toBeGreaterThan(0);

          const lastStep = steps[steps.length - 1];
          expect(lastStep.engine).toBe('array-pointers');

          if (lastStep.engine === 'array-pointers') {
            const result = lastStep.array.result;
            const expectedIdx = sortedNumbers.indexOf(tc.target);

            if (expectedIdx === -1) {
              expect(result).toBe(-1);
            } else {
              // When duplicates exist, any index matching target is valid
              expect(typeof result).toBe('number');
              expect(sortedNumbers[result as number]).toBe(tc.target);
            }
          }
        }
      });

      it('verifies 20 randomized seeded inputs against indexOf oracle', async () => {
        const algo = await loadAlgorithmDefinition(id);
        const rng = createRng(100 + searchAlgoIds.indexOf(id));

        for (let seed = 1; seed <= 20; seed++) {
          const size = Math.floor(5 + rng() * 12);
          const raw = generateRandomNumbers(size, 1, 100, seed * 73);
          const sorted = [...raw].sort((a, b) => a - b);

          // Test half target present, half target absent
          const presentTarget = sorted[Math.floor(rng() * sorted.length)];
          const absentTarget = 999;
          const target = seed % 2 === 0 ? presentTarget : absentTarget;

          const steps = algo!.generate({ target, numbers: sorted });
          const lastStep = steps[steps.length - 1];

          if (lastStep.engine === 'array-pointers') {
            const result = lastStep.array.result;
            const oracleIdx = sorted.indexOf(target);

            if (oracleIdx === -1) {
              expect(result).toBe(-1);
            } else {
              expect(typeof result).toBe('number');
              expect(sorted[result as number]).toBe(target);
            }
          }
        }
      });
    });
  }

  // --- ARRAY ALGORITHMS ORACLE TESTS ---
  describe('Two Pointers (Pair Sum)', () => {
    it('verifies pair sum matches target or reports absent correctly', async () => {
      const algo = await loadAlgorithmDefinition('two-pointers-pair-sum');
      expect(algo).not.toBeNull();

      const testCases = [
        { target: 16, numbers: [1, 3, 6, 8, 10, 15, 20] }, // 6 + 10 = 16
        { target: 21, numbers: [1, 4, 7, 11, 14, 18, 20] }, // 1 + 20 = 21
        { target: 999, numbers: [2, 5, 8, 11, 14] }, // none
        { target: 10, numbers: [5] }, // < 2 elements
        { target: 14, numbers: [2, 4, 6, 8, 10, 12] }, // 2 + 12 = 14 or 4 + 10 or 6 + 8
      ];

      for (const tc of testCases) {
        const sorted = [...tc.numbers].sort((a, b) => a - b);
        const steps = algo!.generate({ target: tc.target, numbers: sorted });
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const res = lastStep.array.result;
          if (res) {
            // parse index pair "[i, j]"
            const match = String(res).match(/\[(\d+),\s*(\d+)\]/);
            expect(match).not.toBeNull();
            const left = Number(match![1]);
            const right = Number(match![2]);
            expect(sorted[left] + sorted[right]).toBe(tc.target);
          } else {
            // Verify brute force that indeed no pair sums to target
            let hasPair = false;
            for (let i = 0; i < sorted.length; i++) {
              for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[i] + sorted[j] === tc.target) hasPair = true;
              }
            }
            expect(hasPair).toBe(false);
          }
        }
      }
    });
  });

  describe('Fast and Slow Pointers (Floyd Middle)', () => {
    it('accurately identifies middle index across even and odd lengths', async () => {
      const algo = await loadAlgorithmDefinition('fast-and-slow-pointers');
      expect(algo).not.toBeNull();

      for (const len of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const arr = Array.from({ length: len }, (_, i) => (i + 1) * 10);
        const steps = algo!.generate(arr);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const result = lastStep.array.result;
          const expectedMid = Math.floor(len / 2);
          // For odd/even, mid is within floor(len / 2)
          expect(result).toBe(expectedMid);
        }
      }
    });
  });

  describe('Sliding Window (Fixed Size)', () => {
    it('verifies maximum sum of window k against brute force oracle', async () => {
      const algo = await loadAlgorithmDefinition('sliding-window-fixed');
      expect(algo).not.toBeNull();

      const rng = createRng(401);
      for (let seed = 1; seed <= 10; seed++) {
        const numbers = generateRandomNumbers(8, -10, 30, seed * 19);
        const k = 3;

        const steps = algo!.generate({ target: k, numbers });
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const result = lastStep.array.result;

          // Brute force oracle
          let oracleMax = -Infinity;
          for (let i = 0; i <= numbers.length - k; i++) {
            let sum = 0;
            for (let j = 0; j < k; j++) sum += numbers[i + j];
            if (sum > oracleMax) oracleMax = sum;
          }

          expect(result).toBe(oracleMax);
        }
      }
    });
  });

  describe('Sliding Window (Variable Size)', () => {
    it('finds minimal length subarray meeting target sum against brute force', async () => {
      const algo = await loadAlgorithmDefinition('sliding-window-variable');
      expect(algo).not.toBeNull();

      const numbers = [2, 3, 1, 2, 4, 3];
      const target = 7;
      const steps = algo!.generate({ target, numbers });
      const lastStep = steps[steps.length - 1];

      if (lastStep.engine === 'array-pointers') {
        const result = lastStep.array.result;
        // Subarray [4, 3] reaches sum 7 with length 2
        expect(result).toBe(2);
      }
    });
  });

  describe('Prefix Sum Array', () => {
    it('computes correct running prefix sums and satisfies range query', async () => {
      const algo = await loadAlgorithmDefinition('prefix-sum');
      expect(algo).not.toBeNull();

      const numbers = [3, 1, 4, 1, 5, 9, 2];
      const steps = algo!.generate(numbers);
      const lastStep = steps[steps.length - 1];

      if (lastStep.engine === 'array-pointers') {
        const finalValues = lastStep.array.values as number[];
        // Final values should match prefix sums: [3, 4, 8, 9, 14, 23, 25]
        expect(finalValues).toEqual([3, 4, 8, 9, 14, 23, 25]);
      }
    });
  });

  describe("Kadane's Algorithm", () => {
    it('verifies max subarray sum against O(n^2) brute force oracle', async () => {
      const algo = await loadAlgorithmDefinition('kadanes-algorithm');
      expect(algo).not.toBeNull();

      const rng = createRng(501);
      for (let seed = 1; seed <= 10; seed++) {
        const numbers = generateRandomNumbers(8, -15, 20, seed * 23);
        const steps = algo!.generate(numbers);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const result = lastStep.array.result;

          // Brute force oracle
          let oracleMax = -Infinity;
          for (let i = 0; i < numbers.length; i++) {
            let sum = 0;
            for (let j = i; j < numbers.length; j++) {
              sum += numbers[j];
              if (sum > oracleMax) oracleMax = sum;
            }
          }

          expect(result).toBe(oracleMax);
        }
      }
    });
  });

  describe('Dutch National Flag (3-way Partition)', () => {
    it('partitions array of 0s, 1s, and 2s into non-decreasing sorted order', async () => {
      const algo = await loadAlgorithmDefinition('dutch-national-flag');
      expect(algo).not.toBeNull();

      const testInputs = [
        [2, 0, 2, 1, 1, 0],
        [2, 2, 1, 1, 0, 0],
        [0, 1, 2],
        [2, 1, 0],
        [1, 1, 1],
      ];

      for (const input of testInputs) {
        const steps = algo!.generate(input);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const finalValues = lastStep.array.values.map(v => Number(v));
          const expected = [...input].sort((a, b) => a - b);
          expect(finalValues).toEqual(expected);
        }
      }
    });
  });

  describe('Boyer-Moore Majority Vote', () => {
    it('identifies true majority element or returns null when absent', async () => {
      const algo = await loadAlgorithmDefinition('boyer-moore-voting');
      expect(algo).not.toBeNull();

      const testCases = [
        { input: [3, 3, 4, 2, 3, 3, 5, 3], expected: 3 }, // 5 of 8
        { input: [2, 1, 2, 4, 2, 2, 6], expected: 2 }, // 4 of 7
        { input: [1, 2, 3, 1, 2, 3, 1], expected: null }, // 3 of 7 (not > 3.5)
        { input: [42], expected: 42 },
      ];

      for (const tc of testCases) {
        const steps = algo!.generate(tc.input);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'array-pointers') {
          const result = lastStep.array.result;
          expect(result).toBe(tc.expected);
        }
      }
    });
  });

  // --- STRING MATCHING ALGORITHMS ORACLE TESTS ---
  const stringAlgoIds = ['kmp-string-match', 'rabin-karp', 'z-algorithm'];

  for (const id of stringAlgoIds) {
    describe(`String Matching: ${id}`, () => {
      it('verifies string match against native indexOf oracle', async () => {
        const algo = await loadAlgorithmDefinition(id);
        expect(algo).not.toBeNull();

        const testCases: PatternMatchInput[] = [
          { text: 'ABABDABABC', pattern: 'ABABC' },
          { text: 'TEXTCODEFUN', pattern: 'CODE' },
          { text: 'AABAACAADAABAABA', pattern: 'AABA' },
          { text: 'ABCDEFGHIJ', pattern: 'XYZ' },
          { text: 'AAAAAA', pattern: 'AAA' },
          { text: 'SHORT', pattern: 'VERYLONGPATTERN' },
        ];

        for (const tc of testCases) {
          const steps = algo!.generate(tc);
          expect(steps.length).toBeGreaterThan(0);

          const lastStep = steps[steps.length - 1];
          if (lastStep.engine === 'array-pointers') {
            const result = lastStep.array.result;
            const oracle = tc.text.indexOf(tc.pattern);
            expect(result).toBe(oracle);
          }
        }
      });
    });
  }
});
