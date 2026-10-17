/**
 * Fibonacci (Tabulation DP) - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';

export const fibonacciDpDefinition: AlgoDefinition<number | number[]> = {
  id: 'fibonacci-dp',
  name: 'Fibonacci (Memoization vs Tabulation)',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Demonstrates bottom-up dynamic programming by filling an array table iteratively from base cases F(0)=0 and F(1)=1, computing each cell from the sum of the two preceding cells.',
  pseudocode: [
    'procedure fibonacciDP(n):',
    '  if n = 0 return 0',
    '  if n = 1 return 1',
    '  dp := array of size n + 1',
    '  dp[0] := 0;  dp[1] := 1',
    '  for i := 2 to n do:',
    '    dp[i] := dp[i - 1] + dp[i - 2]',
    '  return dp[n]',
  ],
  presets: [
    {
      name: 'n-7',
      label: 'Fibonacci(7)',
      description: 'Standard run demonstrating progressive table filling.',
      input: 7,
    },
    {
      name: 'n-5',
      label: 'Fibonacci(5)',
      description: 'Quick walkthrough of base cases and transitions.',
      input: 5,
    },
    {
      name: 'n-10',
      label: 'Fibonacci(10)',
      description: 'Double digit tabulation reaching 55.',
      input: 10,
    },
  ],
  generate(input: number | number[]): GridTableStep[] {
    const rawN = Array.isArray(input) ? input[0] : input;
    const parsedN = rawN !== undefined && Number.isFinite(Number(rawN)) ? Number(rawN) : 7;
    const n = Math.max(0, Math.min(15, Math.round(parsedN)));
    const steps: GridTableStep[] = [];

    const dp: (number | string)[] = new Array(n + 1).fill('—');

    const record = (
      caption: string,
      line: number,
      activeCol?: number,
      sourceCols?: number[],
      vars?: Record<string, string | number | boolean>,
      tracebackPath?: [number, number][]
    ) => {
      const cells: GridCell[] = dp.map((val, c) => {
        let mark: GridCell['mark'] = undefined;
        if (activeCol === c) mark = 'current';
        else if (sourceCols?.includes(c)) mark = 'source';
        else if (val !== '—') mark = 'computed';

        return {
          r: 0,
          c,
          value: val,
          mark,
        };
      });

      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows: 1,
          cols: n + 1,
          cells,
          colLabels: Array.from({ length: n + 1 }, (_, i) => `F(${i})`),
          rowLabels: ['dp'],
          tracebackPath,
        },
      });
    };

    record(`Allocate DP table of size ${n + 1} with all cells uncomputed.`, 4, undefined, undefined, { n });

    dp[0] = 0;
    record('Base case: F(0) = 0.', 5, 0, undefined, { 'dp[0]': 0 });

    if (n >= 1) {
      dp[1] = 1;
      record('Base case: F(1) = 1.', 5, 1, undefined, { 'dp[1]': 1 });
    }

    for (let i = 2; i <= n; i++) {
      const prev1 = Number(dp[i - 1]);
      const prev2 = Number(dp[i - 2]);
      const current = prev1 + prev2;
      dp[i] = current;

      record(
        `Compute F(${i}) = F(${i - 1}) + F(${i - 2}) = ${prev1} + ${prev2} = ${current}.`,
        7,
        i,
        [i - 2, i - 1],
        { i, 'dp[i-2]': prev2, 'dp[i-1]': prev1, 'dp[i]': current }
      );
    }

    record(
      `Tabulation complete. Final answer F(${n}) = ${dp[n]}.`,
      8,
      n,
      undefined,
      { n, result: dp[n] },
      [[0, n]]
    );

    return steps;
  },
};

export default fibonacciDpDefinition;
