/**
 * 0/1 Knapsack Problem - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';

export const knapsack01Definition: AlgoDefinition<number[]> = {
  id: 'knapsack-0-1',
  name: '0/1 Knapsack Problem',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(n · W)',
    average: 'O(n · W)',
    worst: 'O(n · W)',
    space: 'O(n · W)',
  },
  inputKind: 'numbers',
  blurb: 'Computes the maximum value obtainable by selecting a subset of items without exceeding the total knapsack weight capacity W, tracing back through the 2D DP table to identify which items were included.',
  pseudocode: [
    'procedure knapsack01(weights, values, W):',
    '  dp := 2D array of size (n + 1) x (W + 1) filled with 0',
    '  for i := 1 to n do:',
    '    for w := 0 to W do:',
    '      if weights[i-1] <= w then:',
    '        dp[i][w] := max(dp[i-1][w], dp[i-1][w - weights[i-1]] + values[i-1])',
    '      else dp[i][w] := dp[i-1][w]',
    '  // Traceback to identify selected items',
    '  return dp[n][W]',
  ],
  presets: [
    {
      name: 'classic-knapsack',
      label: 'Capacity 5 (4 Items)',
      description: 'Items: (w=2,v=3), (w=3,v=4), (w=4,v=5), (w=5,v=6). Max capacity 5.',
      input: [5, 2, 3, 3, 4, 4, 5, 5, 6],
    },
    {
      name: 'small-knapsack',
      label: 'Capacity 4 (3 Items)',
      description: 'Items: (w=1,v=1), (w=2,v=4), (w=3,v=5). Max capacity 4.',
      input: [4, 1, 1, 2, 4, 3, 5],
    },
    {
      name: 'tight-weights',
      label: 'Capacity 6 (3 Items)',
      description: 'Trade-off between high value vs high weight items.',
      input: [6, 2, 6, 2, 10, 3, 12],
    },
  ],
  generate(input: number[]): GridTableStep[] {
    const raw = Array.isArray(input) ? input : [5, 2, 3, 3, 4, 4, 5, 5, 6];
    const W = Math.max(1, Math.min(8, Math.round(raw[0] ?? 5)));

    // Parse item weight-value pairs from remaining numbers
    const items: { w: number; v: number }[] = [];
    for (let k = 1; k < raw.length - 1; k += 2) {
      const w = Math.max(1, Math.min(W, Math.round(raw[k])));
      const v = Math.max(1, Math.min(99, Math.round(raw[k + 1])));
      items.push({ w, v });
      if (items.length >= 4) break;
    }

    if (items.length === 0) {
      items.push({ w: 2, v: 3 }, { w: 3, v: 4 }, { w: 4, v: 5 });
    }

    const n = items.length;
    const steps: GridTableStep[] = [];

    // Initialize DP table (n + 1) rows, (W + 1) cols
    const dp: (number | string)[][] = Array.from({ length: n + 1 }, () =>
      new Array(W + 1).fill('—')
    );

    const rowLabels = ['Item 0 (None)', ...items.map((it, idx) => `Item ${idx + 1} (w=${it.w}, v=${it.v})`)];
    const colLabels = Array.from({ length: W + 1 }, (_, w) => `w=${w}`);

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      sourceCells?: [number, number][],
      vars?: Record<string, string | number | boolean>,
      tracebackPath?: [number, number][]
    ) => {
      const cells: GridCell[] = [];
      for (let r = 0; r <= n; r++) {
        for (let c = 0; c <= W; c++) {
          let mark: GridCell['mark'] = undefined;
          if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = 'current';
          } else if (sourceCells?.some(([sr, sc]) => sr === r && sc === c)) {
            mark = 'source';
          } else if (tracebackPath?.some(([tr, tc]) => tr === r && tc === c)) {
            mark = 'path';
          } else if (dp[r][c] !== '—') {
            mark = 'computed';
          }

          cells.push({ r, c, value: dp[r][c], mark });
        }
      }

      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows: n + 1,
          cols: W + 1,
          cells,
          rowLabels,
          colLabels,
          tracebackPath,
        },
      });
    };

    record(
      `Initialize DP table of size (${n + 1} items) × (${W + 1} capacities) for capacity W=${W}.`,
      2,
      undefined,
      undefined,
      { capacity: W, numItems: n }
    );

    // Row 0 base case: 0 items yields 0 value
    for (let w = 0; w <= W; w++) {
      dp[0][w] = 0;
    }
    record('Base case: 0 items available yields total value 0 for all capacities.', 2, [0, 0], undefined, {
      row: 0,
      value: 0,
    });

    // DP table fill
    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      for (let w = 0; w <= W; w++) {
        if (item.w <= w) {
          const excludeVal = Number(dp[i - 1][w]);
          const includeVal = Number(dp[i - 1][w - item.w]) + item.v;
          const best = Math.max(excludeVal, includeVal);
          dp[i][w] = best;

          record(
            `Item ${i} (w=${item.w}, v=${item.v}) at capacity ${w}: compare exclude (${excludeVal}) vs include (${includeVal}). dp[${i}][${w}] = ${best}.`,
            6,
            [i, w],
            [
              [i - 1, w],
              [i - 1, w - item.w],
            ],
            {
              item: i,
              weight: item.w,
              value: item.v,
              capacity: w,
              excludeVal,
              includeVal,
              'dp[i][w]': best,
            }
          );
        } else {
          const excludeVal = Number(dp[i - 1][w]);
          dp[i][w] = excludeVal;

          record(
            `Item ${i} weight ${item.w} exceeds capacity ${w}. Must exclude: dp[${i}][${w}] = dp[${i - 1}][${w}] = ${excludeVal}.`,
            7,
            [i, w],
            [[i - 1, w]],
            { item: i, weight: item.w, capacity: w, 'dp[i][w]': excludeVal }
          );
        }
      }
    }

    // Traceback phase to find selected items
    const selectedItems: number[] = [];
    const path: [number, number][] = [];
    let curR = n;
    let curC = W;
    path.push([curR, curC]);

    while (curR > 0 && curC > 0) {
      if (dp[curR][curC] !== dp[curR - 1][curC]) {
        // Item curR was included
        selectedItems.push(curR);
        curC -= items[curR - 1].w;
      }
      curR -= 1;
      path.push([curR, curC]);
    }

    selectedItems.reverse();
    const maxValue = dp[n][W];

    record(
      `Knapsack DP complete! Maximum value is ${maxValue}. Traceback selected items: [${selectedItems.map(idx => `Item ${idx}`).join(', ')}].`,
      9,
      [n, W],
      undefined,
      {
        maxValue,
        selectedItems: selectedItems.join(', '),
        result: maxValue,
      },
      path
    );

    return steps;
  },
};

export default knapsack01Definition;

