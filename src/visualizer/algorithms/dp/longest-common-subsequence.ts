/**
 * Longest Common Subsequence (LCS) - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { PatternMatchInput } from '../../core/inputs';

export const longestCommonSubsequenceDefinition: AlgoDefinition<PatternMatchInput> = {
  id: 'longest-common-subsequence',
  name: 'Longest Common Subsequence (LCS)',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(n · m)',
    average: 'O(n · m)',
    worst: 'O(n · m)',
    space: 'O(n · m)',
  },
  inputKind: 'pattern-match',
  blurb: 'Constructs a 2D dynamic programming table comparing prefixes of two sequences, taking diagonal transitions on matching characters and propagating maximums across adjacent cells.',
  pseudocode: [
    'procedure LCS(text1, text2):',
    '  dp := 2D array of size (n + 1) x (m + 1) filled with 0',
    '  for i := 1 to n do:',
    '    for j := 1 to m do:',
    '      if text1[i-1] = text2[j-1] then:',
    '        dp[i][j] := dp[i-1][j-1] + 1',
    '      else:',
    '        dp[i][j] := max(dp[i-1][j], dp[i][j-1])',
    '  return tracebackLCS(dp, text1, text2)',
  ],
  presets: [
    {
      name: 'dna-sequences',
      label: 'DNA Subsequences (AGGTAB & GXTXAYB)',
      description: 'Finds GTAB with length 4 across interleaved nucleotide strings.',
      input: { text: 'AGGTAB', pattern: 'GXTXAYB' },
    },
    {
      name: 'words-ace',
      label: 'Subsequence ACE in ABCDE',
      description: 'Textbook LeetCode example yielding length 3.',
      input: { text: 'ABCDE', pattern: 'ACE' },
    },
    {
      name: 'identical-strings',
      label: 'Identical Strings (BANANA)',
      description: 'Diagonal transitions on every character position.',
      input: { text: 'BANANA', pattern: 'BANANA' },
    },
  ],
  generate(input: PatternMatchInput): GridTableStep[] {
    const s1 = (input.text || 'ABCDE').slice(0, 7);
    const s2 = (input.pattern || 'ACE').slice(0, 7);
    const n = s1.length;
    const m = s2.length;
    const steps: GridTableStep[] = [];

    const dp: (number | string)[][] = Array.from({ length: n + 1 }, () =>
      new Array(m + 1).fill('—')
    );

    const rowLabels = ['Ø (empty)', ...s1.split('').map((ch, idx) => `[${idx}] '${ch}'`)];
    const colLabels = ['Ø (empty)', ...s2.split('').map((ch, idx) => `[${idx}] '${ch}'`)];

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
      `Initialize LCS table for "${s1}" (len ${n}) and "${s2}" (len ${m}).`,
      2,
      undefined,
      undefined,
      { s1, s2, rows: n + 1, cols: m + 1 }
    );

    // Base cases: 0 for empty prefixes
    for (let i = 0; i <= n; i++) dp[i][0] = 0;
    for (let j = 0; j <= m; j++) dp[0][j] = 0;

    record('Base cases: row 0 and col 0 filled with 0 (empty prefix yields LCS 0).', 2, [0, 0]);

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const char1 = s1[i - 1];
        const char2 = s2[j - 1];

        if (char1 === char2) {
          const diagVal = Number(dp[i - 1][j - 1]);
          dp[i][j] = diagVal + 1;

          record(
            `Match: s1[${i - 1}]='${char1}' == s2[${j - 1}]='${char2}'. Take diagonal dp[${i - 1}][${j - 1}] + 1 = ${diagVal + 1}.`,
            6,
            [i, j],
            [[i - 1, j - 1]],
            { i, j, char1, char2, 'dp[i-1][j-1]': diagVal, 'dp[i][j]': diagVal + 1 }
          );
        } else {
          const topVal = Number(dp[i - 1][j]);
          const leftVal = Number(dp[i][j - 1]);
          const best = Math.max(topVal, leftVal);
          dp[i][j] = best;

          record(
            `Mismatch: '${char1}' != '${char2}'. Take max(top=${topVal}, left=${leftVal}) = ${best}.`,
            8,
            [i, j],
            [
              [i - 1, j],
              [i, j - 1],
            ],
            { i, j, char1, char2, top: topVal, left: leftVal, 'dp[i][j]': best }
          );
        }
      }
    }

    // Traceback to construct LCS string
    const lcsChars: string[] = [];
    const path: [number, number][] = [];
    let curR = n;
    let curC = m;
    path.push([curR, curC]);

    while (curR > 0 && curC > 0) {
      if (s1[curR - 1] === s2[curC - 1]) {
        lcsChars.push(s1[curR - 1]);
        curR -= 1;
        curC -= 1;
      } else if (Number(dp[curR - 1][curC]) >= Number(dp[curR][curC - 1])) {
        curR -= 1;
      } else {
        curC -= 1;
      }
      path.push([curR, curC]);
    }

    lcsChars.reverse();
    const lcsString = lcsChars.join('');
    const lcsLength = dp[n][m];

    record(
      `LCS tabulation complete! Length is ${lcsLength}. Traceback path reveals sequence: "${lcsString}".`,
      9,
      [n, m],
      undefined,
      {
        lcsLength,
        lcsString,
        result: lcsString,
      },
      path
    );

    return steps;
  },
};

export default longestCommonSubsequenceDefinition;
