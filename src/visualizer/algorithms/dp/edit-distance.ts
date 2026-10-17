/**
 * Edit Distance (Levenshtein) - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { PatternMatchInput } from '../../core/inputs';

export const editDistanceDefinition: AlgoDefinition<PatternMatchInput> = {
  id: 'edit-distance',
  name: 'Edit Distance (Levenshtein)',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(n · m)',
    average: 'O(n · m)',
    worst: 'O(n · m)',
    space: 'O(n · m)',
  },
  inputKind: 'pattern-match',
  blurb: 'Computes the minimum number of single-character insertions, deletions, or substitutions required to transform word1 into word2 using a 2D dynamic programming grid.',
  pseudocode: [
    'procedure minDistance(word1, word2):',
    '  dp := 2D array of size (n + 1) x (m + 1)',
    '  for i := 0 to n do dp[i][0] := i',
    '  for j := 0 to m do dp[0][j] := j',
    '  for i := 1 to n do:',
    '    for j := 1 to m do:',
    '      if word1[i-1] = word2[j-1] then dp[i][j] := dp[i-1][j-1]',
    '      else dp[i][j] := 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])',
    '  return dp[n][m]',
  ],
  presets: [
    {
      name: 'horse-ros',
      label: 'horse -> ros (Distance 3)',
      description: 'Classic LeetCode transformation with replace, delete, replace.',
      input: { text: 'horse', pattern: 'ros' },
    },
    {
      name: 'intention-execution',
      label: 'kitten -> sitting (Distance 3)',
      description: 'Replace k->s, e->i, insert g.',
      input: { text: 'kitten', pattern: 'sitting' },
    },
    {
      name: 'identical-words',
      label: 'cat -> cat (Distance 0)',
      description: 'Zero operations required; purely diagonal 0s.',
      input: { text: 'cat', pattern: 'cat' },
    },
  ],
  generate(input: PatternMatchInput): GridTableStep[] {
    const w1 = (input.text || 'horse').slice(0, 6);
    const w2 = (input.pattern || 'ros').slice(0, 6);
    const n = w1.length;
    const m = w2.length;
    const steps: GridTableStep[] = [];

    const dp: (number | string)[][] = Array.from({ length: n + 1 }, () =>
      new Array(m + 1).fill('—')
    );

    const rowLabels = ['Ø (empty)', ...w1.split('').map((ch, idx) => `[${idx}] '${ch}'`)];
    const colLabels = ['Ø (empty)', ...w2.split('').map((ch, idx) => `[${idx}] '${ch}'`)];

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
        for (let c = 0; c <= m; c++) {
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
          cols: m + 1,
          cells,
          rowLabels,
          colLabels,
          tracebackPath,
        },
      });
    };

    record(
      `Initialize Edit Distance table: transform "${w1}" into "${w2}".`,
      2,
      undefined,
      undefined,
      { word1: w1, word2: w2 }
    );

    // Base cases
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;

    record(
      'Base cases: dp[i][0]=i (deleting all i characters) and dp[0][j]=j (inserting all j characters).',
      4,
      [0, 0]
    );

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const c1 = w1[i - 1];
        const c2 = w2[j - 1];

        if (c1 === c2) {
          const diag = Number(dp[i - 1][j - 1]);
          dp[i][j] = diag;

          record(
            `Characters match: w1[${i - 1}]='${c1}' == w2[${j - 1}]='${c2}'. No edit cost: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${diag}.`,
            7,
            [i, j],
            [[i - 1, j - 1]],
            { i, j, c1, c2, 'dp[i-1][j-1]': diag, 'dp[i][j]': diag }
          );
        } else {
          const replace = Number(dp[i - 1][j - 1]);
          const del = Number(dp[i - 1][j]);
          const insert = Number(dp[i][j - 1]);
          const minOp = Math.min(replace, del, insert);
          dp[i][j] = 1 + minOp;

          const opName = minOp === replace ? 'replace' : minOp === del ? 'delete' : 'insert';

          record(
            `Mismatch: '${c1}' != '${c2}'. 1 + min(replace=${replace}, delete=${del}, insert=${insert}) = ${1 + minOp} (via ${opName}).`,
            8,
            [i, j],
            [
              [i - 1, j - 1],
              [i - 1, j],
              [i, j - 1],
            ],
            { i, j, c1, c2, replace, delete: del, insert, chosenOp: opName, 'dp[i][j]': 1 + minOp }
          );
        }
      }
    }

    // Traceback edit path
    const path: [number, number][] = [];
    let curR = n;
    let curC = m;
    path.push([curR, curC]);

    while (curR > 0 || curC > 0) {
      if (curR > 0 && curC > 0 && w1[curR - 1] === w2[curC - 1]) {
        curR -= 1;
        curC -= 1;
      } else {
        const diag = curR > 0 && curC > 0 ? Number(dp[curR - 1][curC - 1]) : Infinity;
        const up = curR > 0 ? Number(dp[curR - 1][curC]) : Infinity;
        const left = curC > 0 ? Number(dp[curR][curC - 1]) : Infinity;
        const minVal = Math.min(diag, up, left);

        if (minVal === diag) {
          curR -= 1;
          curC -= 1;
        } else if (minVal === up) {
          curR -= 1;
        } else {
          curC -= 1;
        }
      }
      path.push([curR, curC]);
    }

    const minDistance = dp[n][m];

    record(
      `Edit distance complete! Minimum operations to transform "${w1}" into "${w2}" is ${minDistance}.`,
      9,
      [n, m],
      undefined,
      {
        word1: w1,
        word2: w2,
        minDistance,
        result: minDistance,
      },
      path
    );

    return steps;
  },
};

export default editDistanceDefinition;
