/**
 * Matrix Spiral Traversal - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { GridDataInput } from '../../core/inputs';

export const matrixSpiralTraversalDefinition: AlgoDefinition<GridDataInput> = {
  id: 'matrix-spiral-traversal',
  name: 'Matrix Spiral Traversal',
  category: 'matrices',
  engine: 'grid-table',
  complexity: {
    best: 'O(m · n)',
    average: 'O(m · n)',
    worst: 'O(m · n)',
    space: 'O(1)',
  },
  inputKind: 'grid',
  blurb: 'Visits every element of an m × n matrix in clockwise spiral order by progressively shrinking the top, bottom, left, and right boundary pointers.',
  pseudocode: [
    'procedure spiralOrder(matrix):',
    '  top := 0, bottom := rows - 1, left := 0, right := cols - 1',
    '  while top <= bottom and left <= right do:',
    '    for c := left to right do visit(matrix[top][c]); top := top + 1',
    '    for r := top to bottom do visit(matrix[r][right]); right := right - 1',
    '    if top <= bottom then:',
    '      for c := right down to left do visit(matrix[bottom][c]); bottom := bottom - 1',
    '    if left <= right then:',
    '      for r := bottom down to top do visit(matrix[r][left]); left := left + 1',
  ],
  presets: [
    {
      name: 'square-3x3',
      label: 'Square Matrix (3 x 3)',
      description: 'Values 1 to 9 visited in clockwise spiral sequence.',
      input: {
        rows: 3,
        cols: 3,
        grid: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      },
    },
    {
      name: 'rectangular-3x4',
      label: 'Rectangular Matrix (3 x 4)',
      description: 'Shrinking boundaries with uneven aspect ratio.',
      input: {
        rows: 3,
        cols: 4,
        grid: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
        ],
      },
    },
    {
      name: 'single-row',
      label: 'Single Row (1 x 5)',
      description: 'Edge case: single horizontal strip.',
      input: {
        rows: 1,
        cols: 5,
        grid: [[10, 20, 30, 40, 50]],
      },
    },
  ],
  generate(input: GridDataInput): GridTableStep[] {
    const rows = Math.max(1, Math.min(6, input.rows || 3));
    const cols = Math.max(1, Math.min(6, input.cols || 3));

    // Construct matrix values
    const matrix: (number | string)[][] = input.grid && input.grid.length > 0
      ? input.grid.map((row, r) =>
          row && row.length > 0
            ? row.map((v, c) => v)
            : Array.from({ length: cols }, (_, c) => r * cols + c + 1)
        )
      : Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => r * cols + c + 1)
        );

    const steps: GridTableStep[] = [];
    const visitedSet = new Set<string>();
    const spiralOrder: (number | string)[] = [];
    const path: [number, number][] = [];

    const rowLabels = Array.from({ length: rows }, (_, r) => `Row ${r}`);
    const colLabels = Array.from({ length: cols }, (_, c) => `Col ${c}`);

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      vars?: Record<string, string | number | boolean>
    ) => {
      const cells: GridCell[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let mark: GridCell['mark'] = undefined;
          const key = `${r},${c}`;

          if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = 'current';
          } else if (path.some(([pr, pc]) => pr === r && pc === c)) {
            mark = 'path';
          } else if (visitedSet.has(key)) {
            mark = 'visited';
          }

          cells.push({ r, c, value: matrix[r]?.[c] ?? (r * cols + c + 1), mark });
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
          tracebackPath: [...path],
          auxiliary: `Spiral Output: [${spiralOrder.join(', ')}]`,
        },
      });
    };

    let top = 0;
    let bottom = rows - 1;
    let left = 0;
    let right = cols - 1;

    record(
      `Initialize spiral traversal: top=0, bottom=${bottom}, left=0, right=${right}.`,
      2,
      undefined,
      { top, bottom, left, right }
    );

    while (top <= bottom && left <= right) {
      // 1. Traverse Right
      for (let c = left; c <= right; c++) {
        const val = matrix[top][c];
        visitedSet.add(`${top},${c}`);
        path.push([top, c]);
        spiralOrder.push(val);

        record(
          `Traverse Right along row ${top}: visit cell (${top}, ${c}) = ${val}.`,
          4,
          [top, c],
          { dir: 'Right', r: top, c, val, spiralLength: spiralOrder.length }
        );
      }
      top++;

      // 2. Traverse Down
      for (let r = top; r <= bottom; r++) {
        const val = matrix[r][right];
        visitedSet.add(`${r},${right}`);
        path.push([r, right]);
        spiralOrder.push(val);

        record(
          `Traverse Down along col ${right}: visit cell (${r}, ${right}) = ${val}.`,
          5,
          [r, right],
          { dir: 'Down', r, c: right, val, spiralLength: spiralOrder.length }
        );
      }
      right--;

      // 3. Traverse Left
      if (top <= bottom) {
        for (let c = right; c >= left; c--) {
          const val = matrix[bottom][c];
          visitedSet.add(`${bottom},${c}`);
          path.push([bottom, c]);
          spiralOrder.push(val);

          record(
            `Traverse Left along row ${bottom}: visit cell (${bottom}, ${c}) = ${val}.`,
            7,
            [bottom, c],
            { dir: 'Left', r: bottom, c, val, spiralLength: spiralOrder.length }
          );
        }
        bottom--;
      }

      // 4. Traverse Up
      if (left <= right) {
        for (let r = bottom; r >= top; r--) {
          const val = matrix[r][left];
          visitedSet.add(`${r},${left}`);
          path.push([r, left]);
          spiralOrder.push(val);

          record(
            `Traverse Up along col ${left}: visit cell (${r}, ${left}) = ${val}.`,
            9,
            [r, left],
            { dir: 'Up', r, c: left, val, spiralLength: spiralOrder.length }
          );
        }
        left++;
      }
    }

    record(
      `Matrix spiral traversal complete! Visited all ${rows * cols} cells: [${spiralOrder.join(', ')}].`,
      9,
      undefined,
      { totalVisited: spiralOrder.length, spiral: spiralOrder.join(', '), result: spiralOrder.join(', ') }
    );

    return steps;
  },
};

export default matrixSpiralTraversalDefinition;

