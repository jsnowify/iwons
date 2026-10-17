/**
 * Unique Paths in Grid - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { GridDataInput } from '../../core/inputs';

export const gridUniquePathsDefinition: AlgoDefinition<GridDataInput> = {
  id: 'grid-unique-paths',
  name: 'Unique Paths in Grid',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(m · n)',
    average: 'O(m · n)',
    worst: 'O(m · n)',
    space: 'O(m · n)',
  },
  inputKind: 'grid',
  blurb: 'Calculates the number of unique paths from the top-left corner to the bottom-right corner of an m × n grid moving only right and down, accounting for optional obstacles.',
  pseudocode: [
    'procedure uniquePaths(grid, m, n):',
    '  dp := 2D array of size m x n',
    '  dp[0][0] := 1 if grid[0][0] != obstacle else 0',
    '  for r := 0 to m - 1 do:',
    '    for c := 0 to n - 1 do:',
    '      if (r = 0 and c = 0) or grid[r][c] = obstacle continue',
    '      top := dp[r - 1][c] if r > 0 else 0',
    '      left := dp[r][c - 1] if c > 0 else 0',
    '      dp[r][c] := top + left',
    '  return dp[m - 1][n - 1]',
  ],
  presets: [
    {
      name: 'grid-3x4-open',
      label: '3 x 4 Grid (Open)',
      description: 'Standard 3x4 grid yielding 10 unique paths from start to finish.',
      input: {
        rows: 3,
        cols: 4,
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
    },
    {
      name: 'grid-with-obstacle',
      label: '3 x 3 Grid with Obstacle',
      description: 'Single obstacle at center (1, 1) blocking direct diagonal routing.',
      input: {
        rows: 3,
        cols: 3,
        grid: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      },
    },
    {
      name: 'grid-4x4-open',
      label: '4 x 4 Grid (Open)',
      description: 'Yields 20 unique combinatorial paths (6 choose 3 = 20).',
      input: {
        rows: 4,
        cols: 4,
        grid: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
    },
  ],
  generate(input: GridDataInput): GridTableStep[] {
    const rows = Math.max(2, Math.min(6, input.rows || 3));
    const cols = Math.max(2, Math.min(6, input.cols || 4));
    const obstacleGrid = input.grid || Array.from({ length: rows }, () => new Array(cols).fill(0));

    const steps: GridTableStep[] = [];
    const dp: (number | string)[][] = Array.from({ length: rows }, () =>
      new Array(cols).fill('—')
    );

    const rowLabels = Array.from({ length: rows }, (_, r) => `Row ${r}`);
    const colLabels = Array.from({ length: cols }, (_, c) => `Col ${c}`);

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      sourceCells?: [number, number][],
      vars?: Record<string, string | number | boolean>,
      tracebackPath?: [number, number][]
    ) => {
      const cells: GridCell[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let mark: GridCell['mark'] = undefined;
          const isObstacle = obstacleGrid[r]?.[c] === 1;

          if (isObstacle) {
            mark = 'wall';
          } else if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = 'current';
          } else if (sourceCells?.some(([sr, sc]) => sr === r && sc === c)) {
            mark = 'source';
          } else if (tracebackPath?.some(([tr, tc]) => tr === r && tc === c)) {
            mark = 'path';
          } else if (dp[r][c] !== '—') {
            mark = 'computed';
          }

          cells.push({
            r,
            c,
            value: isObstacle ? '■' : dp[r][c],
            mark,
          });
        }
      }

      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows,
          cols,
          cells,
          rowLabels,
          colLabels,
          tracebackPath,
        },
      });
    };

    record(
      `Initialize unique paths DP grid of size ${rows} × ${cols}.`,
      2,
      undefined,
      undefined,
      { rows, cols }
    );

    // Start cell
    if (obstacleGrid[0]?.[0] === 1) {
      dp[0][0] = 0;
      record('Start cell (0, 0) is blocked by an obstacle. 0 paths possible.', 3, [0, 0]);
      return steps;
    }

    dp[0][0] = 1;
    record('Base case: start position (0, 0) has 1 unique way to start.', 3, [0, 0], undefined, {
      'dp[0][0]': 1,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;

        if (obstacleGrid[r]?.[c] === 1) {
          dp[r][c] = 0;
          record(`Cell (${r}, ${c}) is an obstacle. Set dp[${r}][${c}] = 0.`, 5, [r, c]);
          continue;
        }

        const top = r > 0 ? Number(dp[r - 1][c]) : 0;
        const left = c > 0 ? Number(dp[r][c - 1]) : 0;
        const total = top + left;
        dp[r][c] = total;

        const sources: [number, number][] = [];
        if (r > 0 && obstacleGrid[r - 1]?.[c] !== 1) sources.push([r - 1, c]);
        if (c > 0 && obstacleGrid[r]?.[c - 1] !== 1) sources.push([r, c - 1]);

        record(
          `Cell (${r}, ${c}): top paths (${top}) + left paths (${left}) = ${total} unique paths to this cell.`,
          9,
          [r, c],
          sources,
          { r, c, fromTop: top, fromLeft: left, 'dp[r][c]': total }
        );
      }
    }

    // Reconstruct one sample path from finish back to start
    const path: [number, number][] = [];
    let curR = rows - 1;
    let curC = cols - 1;
    path.push([curR, curC]);

    while (curR > 0 || curC > 0) {
      if (curR > 0 && Number(dp[curR - 1][curC]) > 0) {
        curR -= 1;
      } else if (curC > 0) {
        curC -= 1;
      } else {
        break;
      }
      path.push([curR, curC]);
    }

    const finalAnswer = dp[rows - 1][cols - 1];

    record(
      `Unique paths DP complete! Total unique paths from (0, 0) to (${rows - 1}, ${cols - 1}) is ${finalAnswer}. Sample route highlighted in green.`,
      10,
      [rows - 1, cols - 1],
      undefined,
      {
        totalPaths: finalAnswer,
        result: finalAnswer,
      },
      path
    );

    return steps;
  },
};

export default gridUniquePathsDefinition;

