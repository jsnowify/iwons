/**
 * Sudoku Solver Backtracking - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { GridDataInput } from '../../core/inputs';

export const sudokuSolverDefinition: AlgoDefinition<GridDataInput> = {
  id: 'sudoku-solver',
  name: 'Sudoku Solver',
  category: 'backtracking',
  engine: 'grid-table',
  complexity: {
    best: 'O(9^m)',
    average: 'O(9^m)',
    worst: 'O(9^m)',
    space: 'O(81)',
  },
  inputKind: 'grid',
  blurb: 'Fills empty puzzle cells using recursive depth-first backtracking, checking row uniqueness, column uniqueness, and subgrid constraints before each placement.',
  pseudocode: [
    'procedure solveSudoku(grid):',
    '  find first empty cell (row, col)',
    '  if no empty cell remains return true // puzzle solved',
    '  for num := 1 to size do:',
    '    if isValid(grid, row, col, num) then:',
    '      grid[row][col] := num',
    '      if solveSudoku(grid) return true',
    '      grid[row][col] := 0 // backtrack',
    '  return false',
  ],
  presets: [
    {
      name: 'mini-sudoku-4x4',
      label: '4x4 Mini Sudoku (Fast Walkthrough)',
      description: '4x4 grid with 2x2 subgrids, digits 1-4. Clear visual demonstration.',
      input: {
        rows: 4,
        cols: 4,
        grid: [
          [1, 2, 0, 0],
          [0, 0, 2, 1],
          [0, 3, 0, 0],
          [2, 0, 0, 4],
        ],
      },
    },
    {
      name: 'mini-sudoku-near-complete',
      label: '4x4 Puzzle (3 Empty Cells)',
      description: 'Direct step-by-step filling of remaining slots.',
      input: {
        rows: 4,
        cols: 4,
        grid: [
          [1, 2, 3, 4],
          [4, 3, 0, 0],
          [3, 1, 4, 2],
          [2, 4, 0, 3],
        ],
      },
    },
  ],
  generate(input: GridDataInput): GridTableStep[] {
    const rawGrid = input.grid && input.grid.length > 0 ? input.grid : [
      [1, 2, 0, 0],
      [0, 0, 2, 1],
      [0, 3, 0, 0],
      [2, 0, 0, 4],
    ];

    const size = rawGrid.length === 9 ? 9 : 4;
    const boxSize = size === 9 ? 3 : 2;
    const steps: GridTableStep[] = [];

    // Clone working grid
    const board: (number | string)[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        const val = rawGrid[r]?.[c] ?? 0;
        return val === 0 ? '·' : val;
      })
    );

    const initialClues = new Set<string>();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== '·') initialClues.add(`${r},${c}`);
      }
    }

    const rowLabels = Array.from({ length: size }, (_, r) => `R${r}`);
    const colLabels = Array.from({ length: size }, (_, c) => `C${c}`);

    const isValid = (r: number, c: number, num: number): boolean => {
      // Row check
      for (let col = 0; col < size; col++) {
        if (board[r][col] === num) return false;
      }
      // Col check
      for (let row = 0; row < size; row++) {
        if (board[row][c] === num) return false;
      }
      // Subgrid check
      const startR = Math.floor(r / boxSize) * boxSize;
      const startC = Math.floor(c / boxSize) * boxSize;
      for (let i = 0; i < boxSize; i++) {
        for (let j = 0; j < boxSize; j++) {
          if (board[startR + i][startC + j] === num) return false;
        }
      }
      return true;
    };

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      vars?: Record<string, string | number | boolean>,
      isFinal?: boolean
    ) => {
      const cells: GridCell[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          let mark: GridCell['mark'] = undefined;
          const key = `${r},${c}`;

          if (isFinal) {
            mark = initialClues.has(key) ? 'computed' : 'path';
          } else if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = 'current';
          } else if (initialClues.has(key)) {
            mark = 'source';
          } else if (board[r][c] !== '·') {
            mark = 'computed';
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
          rows: size,
          cols: size,
          cells,
          rowLabels,
          colLabels,
          auxiliary: isFinal ? 'Status: Solved' : 'Backtracking Solver',
        },
      });
    };

    record(
      `Initialize Sudoku board (${size}×${size} with ${boxSize}×${boxSize} subgrids). Initial clues highlighted.`,
      1,
      undefined,
      { size, clues: initialClues.size }
    );

    let solved = false;
    let stepCount = 0;
    const MAX_STEPS = 250;

    const solve = (): boolean => {
      if (solved || stepCount > MAX_STEPS) return true;

      // Find first empty cell
      let emptyR = -1;
      let emptyC = -1;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === '·') {
            emptyR = r;
            emptyC = c;
            break;
          }
        }
        if (emptyR !== -1) break;
      }

      if (emptyR === -1) {
        solved = true;
        return true;
      }

      for (let num = 1; num <= size; num++) {
        if (stepCount > MAX_STEPS) return true;

        if (isValid(emptyR, emptyC, num)) {
          board[emptyR][emptyC] = num;
          stepCount++;

          record(
            `Candidate placement: Put ${num} at (${emptyR}, ${emptyC}). Valid in row, col, and ${boxSize}×${boxSize} subgrid.`,
            5,
            [emptyR, emptyC],
            { r: emptyR, c: emptyC, triedNum: num, status: 'Placed' }
          );

          if (solve()) return true;

          // Backtrack
          board[emptyR][emptyC] = '·';
          stepCount++;

          record(
            `Backtrack: Choice ${num} at (${emptyR}, ${emptyC}) led to conflict. Retract to '·'.`,
            7,
            [emptyR, emptyC],
            { r: emptyR, c: emptyC, triedNum: num, status: 'Backtracked' }
          );
        }
      }

      return false;
    };

    solve();

    record(
      solved
        ? `Sudoku solved completely! All row, column, and ${boxSize}×${boxSize} subgrid constraints satisfied.`
        : `Sudoku search stopped or maximum frames reached.`,
      2,
      undefined,
      { solved, result: solved ? 'Solved' : 'Unsolved' },
      solved
    );

    return steps;
  },
};

export default sudokuSolverDefinition;
