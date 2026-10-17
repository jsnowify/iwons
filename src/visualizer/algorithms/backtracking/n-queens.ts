/**
 * N-Queens Backtracking - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';

export const nQueensDefinition: AlgoDefinition<number | number[]> = {
  id: 'n-queens',
  name: 'N-Queens Backtracking',
  category: 'backtracking',
  engine: 'grid-table',
  complexity: {
    best: 'O(N!)',
    average: 'O(N!)',
    worst: 'O(N!)',
    space: 'O(N)',
  },
  inputKind: 'numbers',
  blurb: 'Places N non-attacking queens on an N × N chessboard using recursive depth-first backtracking, exploring column placements row by row and retracting upon diagonal or vertical conflict.',
  pseudocode: [
    'procedure solveNQueens(board, row):',
    '  if row = N return true // all N queens placed',
    '  for col := 0 to N - 1 do:',
    '    if isSafe(board, row, col) then:',
    '      board[row][col] := Queen',
    '      if solveNQueens(board, row + 1) return true',
    '      board[row][col] := Empty // backtrack',
    '  return false',
  ],
  presets: [
    {
      name: 'four-queens',
      label: '4-Queens (Smallest Solvable Board)',
      description: 'Finds the solution [ (0, 1), (1, 3), (2, 0), (3, 2) ].',
      input: 4,
    },
    {
      name: 'five-queens',
      label: '5-Queens (Balanced Walkthrough)',
      description: 'Demonstrates branch pruning across 5x5 board.',
      input: 5,
    },
    {
      name: 'six-queens',
      label: '6-Queens (Complex Conflicts)',
      description: 'Multiple recursive backtracks before finding valid placement.',
      input: 6,
    },
  ],
  generate(input: number | number[]): GridTableStep[] {
    const rawVal = Array.isArray(input) ? input[0] : input;
    const N = Math.max(4, Math.min(6, Math.round(Number(rawVal) || 4)));
    const steps: GridTableStep[] = [];

    const board: string[][] = Array.from({ length: N }, () =>
      new Array(N).fill('·')
    );

    const rowLabels = Array.from({ length: N }, (_, r) => `Row ${r}`);
    const colLabels = Array.from({ length: N }, (_, c) => `Col ${c}`);

    const isSafe = (r: number, c: number): boolean => {
      // Check column
      for (let i = 0; i < r; i++) {
        if (board[i][c] === 'Q') return false;
      }
      // Check upper-left diagonal
      for (let i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] === 'Q') return false;
      }
      // Check upper-right diagonal
      for (let i = r - 1, j = c + 1; i >= 0 && j < N; i--, j++) {
        if (board[i][j] === 'Q') return false;
      }
      return true;
    };

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      conflictCells?: [number, number][],
      vars?: Record<string, string | number | boolean>,
      isSolution?: boolean
    ) => {
      const queenPositions: [number, number][] = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (board[r][c] === 'Q') queenPositions.push([r, c]);
        }
      }

      const cells: GridCell[] = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          let mark: GridCell['mark'] = undefined;
          if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = isSolution ? 'path' : 'current';
          } else if (conflictCells?.some(([cr, cc]) => cr === r && cc === c)) {
            mark = 'wall';
          } else if (board[r][c] === 'Q') {
            mark = isSolution ? 'path' : 'computed';
          }

          cells.push({ r, c, value: board[r][c], mark });
        }
      }

      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows: N,
          cols: N,
          cells,
          rowLabels,
          colLabels,
          tracebackPath: isSolution ? queenPositions : undefined,
          auxiliary: `Queens Placed: ${queenPositions.length} of ${N}`,
        },
      });
    };

    record(
      `Initialize empty ${N} × ${N} chessboard for ${N}-Queens puzzle.`,
      1,
      undefined,
      undefined,
      { N, boardSize: `${N}x${N}` }
    );

    let solved = false;

    const backtrack = (row: number): boolean => {
      if (row === N) {
        solved = true;
        record(
          `All ${N} Queens safely positioned without conflicts! Solution complete.`,
          2,
          undefined,
          undefined,
          { solved: true, totalQueens: N, result: 'Solved' },
          true
        );
        return true;
      }

      for (let col = 0; col < N; col++) {
        if (solved) return true;

        if (isSafe(row, col)) {
          board[row][col] = 'Q';
          record(
            `Safe position: Place Queen at (${row}, ${col}). Proceeding to row ${row + 1}.`,
            5,
            [row, col],
            undefined,
            { row, col, status: 'Placed' }
          );

          if (backtrack(row + 1)) return true;

          // Backtrack
          board[row][col] = '·';
          record(
            `Dead end in deeper rows. Backtrack: remove Queen from (${row}, ${col}) and try next column.`,
            7,
            [row, col],
            undefined,
            { row, col, status: 'Backtracked' }
          );
        } else {
          // Conflict
          const conflicts: [number, number][] = [];
          for (let i = 0; i < row; i++) {
            if (board[i][col] === 'Q') conflicts.push([i, col]);
            const d1 = row - i;
            if (col - d1 >= 0 && board[i][col - d1] === 'Q') conflicts.push([i, col - d1]);
            if (col + d1 < N && board[i][col + d1] === 'Q') conflicts.push([i, col + d1]);
          }

          record(
            `Conflict: Queen cannot be placed at (${row}, ${col}) due to existing Queen attack lines.`,
            4,
            [row, col],
            conflicts,
            { row, col, status: 'Conflict' }
          );
        }
      }

      return false;
    };

    backtrack(0);

    return steps;
  },
};

export default nQueensDefinition;

