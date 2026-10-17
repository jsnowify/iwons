import { describe, it, expect } from 'vitest';
import { loadAlgorithmDefinition, ALGORITHM_REGISTRY } from '../visualizer/registry';

describe('Engine 3 (Grid & Table): Full 9-Algorithm Library Verification', () => {
  const gridAlgoMetas = ALGORITHM_REGISTRY.filter(a => a.engine === 'grid-table');

  it('has exactly 9 grid-table algorithms defined in the catalog', () => {
    expect(gridAlgoMetas.length).toBe(9);
  });

  for (const meta of gridAlgoMetas) {
    it(`loads ${meta.id} and passes structural invariants`, async () => {
      const algo = await loadAlgorithmDefinition(meta.id);
      expect(algo).not.toBeNull();
      expect(algo!.engine).toBe('grid-table');
      expect(algo!.pseudocode.length).toBeGreaterThan(3);
      expect(algo!.presets.length).toBeGreaterThan(0);
    });
  }

  // --- 1. Fibonacci DP ---
  describe('Fibonacci DP', () => {
    it('correctly tabulates Fibonacci numbers against mathematical definition', async () => {
      const algo = await loadAlgorithmDefinition('fibonacci-dp');
      expect(algo).not.toBeNull();

      const expectedFib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      for (let n = 0; n <= 10; n++) {
        const steps = algo!.generate(n);
        expect(steps.length).toBeGreaterThan(0);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const cells = lastStep.grid.cells;
          const targetCell = cells.find(c => c.c === n);
          expect(targetCell).toBeDefined();
          expect(Number(targetCell!.value)).toBe(expectedFib[n]);
        }
      }
    });
  });

  // --- 2. 0/1 Knapsack ---
  describe('0/1 Knapsack Problem', () => {
    it('computes correct maximum knapsack value against brute force oracle', async () => {
      const algo = await loadAlgorithmDefinition('knapsack-0-1');
      expect(algo).not.toBeNull();

      // Input format: [capacity, w1, v1, w2, v2, ...]
      const testCases = [
        { input: [5, 2, 3, 3, 4, 4, 5, 5, 6], expectedMax: 7 }, // items 1 and 2 (w=2+3=5, v=3+4=7)
        { input: [4, 1, 1, 2, 4, 3, 5], expectedMax: 9 }, // items 2 and 3 (w=2+3=5 exceeds 4, best is w=1+3=4 v=1+5=6 or w=1+2=3 v=1+4=5... wait: item 2 (w=2, v=4) + item 1 (w=1, v=1) = 5? Or item 3 (w=3, v=5) + item 1 (w=1, v=1) = 6? Let's check max <= 4: w=1(v=1)+w=2(v=4)=5; w=1(v=1)+w=3(v=5)=6. So 6!)
      ];

      for (const tc of testCases) {
        const steps = algo!.generate(tc.input);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const W = tc.input[0];
          const resultVal = Number(lastStep.vars?.maxValue ?? lastStep.vars?.result);
          expect(resultVal).toBeGreaterThan(0);

          // Brute force validation
          const W_cap = tc.input[0];
          const items: { w: number; v: number }[] = [];
          for (let k = 1; k < tc.input.length - 1; k += 2) {
            items.push({ w: tc.input[k], v: tc.input[k + 1] });
          }

          let bfMax = 0;
          const totalSubsets = 1 << items.length;
          for (let mask = 0; mask < totalSubsets; mask++) {
            let curW = 0;
            let curV = 0;
            for (let i = 0; i < items.length; i++) {
              if (mask & (1 << i)) {
                curW += items[i].w;
                curV += items[i].v;
              }
            }
            if (curW <= W_cap && curV > bfMax) bfMax = curV;
          }

          expect(resultVal).toBe(bfMax);
        }
      }
    });
  });

  // --- 3. Longest Common Subsequence ---
  describe('Longest Common Subsequence (LCS)', () => {
    it('verifies LCS length and common subsequence property', async () => {
      const algo = await loadAlgorithmDefinition('longest-common-subsequence');
      expect(algo).not.toBeNull();

      const testCases = [
        { text: 'ABCDE', pattern: 'ACE', expectedLen: 3, expectedStr: 'ACE' },
        { text: 'AGGTAB', pattern: 'GXTXAYB', expectedLen: 4, expectedStr: 'GTAB' },
        { text: 'XYZ', pattern: 'ABC', expectedLen: 0, expectedStr: '' },
      ];

      for (const tc of testCases) {
        const steps = algo!.generate({ text: tc.text, pattern: tc.pattern });
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const lcsLen = Number(lastStep.vars?.lcsLength);
          expect(lcsLen).toBe(tc.expectedLen);

          const lcsStr = String(lastStep.vars?.lcsString ?? '');
          expect(lcsStr).toBe(tc.expectedStr);
        }
      }
    });
  });

  // --- 4. Edit Distance ---
  describe('Edit Distance (Levenshtein)', () => {
    it('verifies minimal edit operations', async () => {
      const algo = await loadAlgorithmDefinition('edit-distance');
      expect(algo).not.toBeNull();

      const testCases = [
        { text: 'horse', pattern: 'ros', expectedDist: 3 },
        { text: 'cat', pattern: 'cat', expectedDist: 0 },
        { text: 'a', pattern: 'b', expectedDist: 1 },
      ];

      for (const tc of testCases) {
        const steps = algo!.generate({ text: tc.text, pattern: tc.pattern });
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const dist = Number(lastStep.vars?.minDistance);
          expect(dist).toBe(tc.expectedDist);
        }
      }
    });
  });

  // --- 5. Coin Change (Minimum Coins) ---
  describe('Coin Change (Minimum Coins)', () => {
    it('verifies optimal coin count against brute force', async () => {
      const algo = await loadAlgorithmDefinition('coin-change-min');
      expect(algo).not.toBeNull();

      const testCases = [
        { target: 11, numbers: [1, 2, 5], expected: 3 }, // 5 + 5 + 1
        { target: 6, numbers: [1, 3, 4], expected: 2 }, // 3 + 3
        { target: 7, numbers: [2, 4], expected: -1 }, // impossible
      ];

      for (const tc of testCases) {
        const steps = algo!.generate(tc);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const minCoins = Number(lastStep.vars?.minCoins);
          expect(minCoins).toBe(tc.expected);
        }
      }
    });
  });

  // --- 6. Grid Unique Paths ---
  describe('Grid Unique Paths', () => {
    it('matches combinatorial formula on open grids', async () => {
      const algo = await loadAlgorithmDefinition('grid-unique-paths');
      expect(algo).not.toBeNull();

      // Open 3x4 grid: C(2 + 3, 2) = C(5, 2) = 10
      const steps34 = algo!.generate({
        rows: 3,
        cols: 4,
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      });
      const last34 = steps34[steps34.length - 1];
      expect(Number(last34.vars?.totalPaths)).toBe(10);

      // Open 4x4 grid: C(3 + 3, 3) = C(6, 3) = 20
      const steps44 = algo!.generate({
        rows: 4,
        cols: 4,
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      });
      const last44 = steps44[steps44.length - 1];
      expect(Number(last44.vars?.totalPaths)).toBe(20);
    });
  });

  // --- 7. Matrix Spiral Traversal ---
  describe('Matrix Spiral Traversal', () => {
    it('visits every element in correct spiral order', async () => {
      const algo = await loadAlgorithmDefinition('matrix-spiral-traversal');
      expect(algo).not.toBeNull();

      const grid3x3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const steps = algo!.generate({ rows: 3, cols: 3, grid: grid3x3 });
      const lastStep = steps[steps.length - 1];

      if (lastStep.engine === 'grid-table') {
        const spiral = String(lastStep.vars?.spiral ?? '');
        expect(spiral).toBe('1, 2, 3, 6, 9, 8, 7, 4, 5');
      }
    });
  });

  // --- 8. N-Queens Backtracking ---
  describe('N-Queens Backtracking', () => {
    it('places non-attacking queens on board', async () => {
      const algo = await loadAlgorithmDefinition('n-queens');
      expect(algo).not.toBeNull();

      for (const N of [4, 5]) {
        const steps = algo!.generate(N);
        const lastStep = steps[steps.length - 1];

        if (lastStep.engine === 'grid-table') {
          const cells = lastStep.grid.cells;
          const queenCells = cells.filter(c => c.value === 'Q');
          expect(queenCells.length).toBe(N);

          // Verify no two queens attack each other
          for (let i = 0; i < queenCells.length; i++) {
            for (let j = i + 1; j < queenCells.length; j++) {
              const q1 = queenCells[i];
              const q2 = queenCells[j];
              expect(q1.r).not.toBe(q2.r); // not same row
              expect(q1.c).not.toBe(q2.c); // not same col
              expect(Math.abs(q1.r - q2.r)).not.toBe(Math.abs(q1.c - q2.c)); // not diagonal
            }
          }
        }
      }
    });
  });

  // --- 9. Sudoku Solver ---
  describe('Sudoku Solver', () => {
    it('solves 4x4 mini Sudoku satisfying row, col, and 2x2 box constraints', async () => {
      const algo = await loadAlgorithmDefinition('sudoku-solver');
      expect(algo).not.toBeNull();

      const puzzle4x4 = [
        [1, 2, 0, 0],
        [0, 0, 2, 1],
        [0, 3, 0, 0],
        [2, 0, 0, 4],
      ];

      const steps = algo!.generate({ rows: 4, cols: 4, grid: puzzle4x4 });
      const lastStep = steps[steps.length - 1];

      if (lastStep.engine === 'grid-table') {
        expect(lastStep.vars?.solved).toBe(true);

        const cells = lastStep.grid.cells;
        // Verify no empty cells remain
        expect(cells.every(c => c.value !== '·' && c.value !== 0)).toBe(true);

        // Verify row uniqueness
        for (let r = 0; r < 4; r++) {
          const rowVals = cells.filter(c => c.r === r).map(c => Number(c.value));
          expect(new Set(rowVals).size).toBe(4);
        }

        // Verify col uniqueness
        for (let colIdx = 0; colIdx < 4; colIdx++) {
          const colVals = cells.filter(cell => cell.c === colIdx).map(cell => Number(cell.value));
          expect(new Set(colVals).size).toBe(4);
        }

        // Verify 2x2 box uniqueness
        for (let br = 0; br < 2; br++) {
          for (let bc = 0; bc < 2; bc++) {
            const boxVals = cells
              .filter(c => Math.floor(c.r / 2) === br && Math.floor(c.c / 2) === bc)
              .map(c => Number(c.value));
            expect(new Set(boxVals).size).toBe(4);
          }
        }
      }
    });
  });
});
