/**
 * Z-Algorithm - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { PatternMatchInput } from '../../core/inputs';

export const zAlgorithmDefinition: AlgoDefinition<PatternMatchInput> = {
  id: 'z-algorithm',
  name: 'Z-Algorithm',
  category: 'strings',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(n)',
  },
  inputKind: 'pattern-match',
  blurb: 'Linear-time pattern matching algorithm that computes the Z-array on a concatenated string (pattern + "$" + text), where Z[i] is the length of the longest substring starting at i that matches a prefix of S.',
  pseudocode: [
    'procedure zAlgorithm(text, pattern):',
    '  S := pattern + "$" + text',
    '  L := 0, R := 0',
    '  for i := 1 to length(S) - 1 do:',
    '    if i > R then:',
    '      compute Z[i] by direct comparison; L := i, R := i + Z[i] - 1',
    '    else:',
    '      k := i - L',
    '      if Z[k] < R - i + 1 then Z[i] := Z[k]',
    '      else compute Z[i] past R; L := i, R := i + Z[i] - 1',
    '    if Z[i] = length(pattern) return i - length(pattern) - 1 // match in text',
  ],
  presets: [
    {
      name: 'standard-match',
      label: 'Pattern ABC in AAABCAABCA',
      description: 'Z-box tracks furthest reach and reuses prefix computations.',
      input: { text: 'AAABCAABCA', pattern: 'ABC' },
    },
    {
      name: 'repeated-letters',
      label: 'Repeated Letters (AAB)',
      description: 'Nested overlapping Z-boxes demonstrate O(1) interior copies.',
      input: { text: 'AABAACAADAABAABA', pattern: 'AABA' },
    },
    {
      name: 'missing-pattern',
      label: 'No Match (XYZ)',
      description: 'Z-values never reach pattern length.',
      input: { text: 'ABCDEFGH', pattern: 'XYZ' },
    },
  ],
  generate(input: PatternMatchInput): ArrayPointersStep[] {
    const text = input.text || 'AAABCAABCA';
    const pattern = input.pattern || 'ABC';
    const S = `${pattern}$${text}`;
    const chars = S.split('');
    const steps: ArrayPointersStep[] = [];
    const n = chars.length;
    const m = pattern.length;

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      marks?: Record<number, ArrayCellMark>,
      range?: { from: number; to: number; label?: string },
      vars?: Record<string, string | number | boolean>,
      result?: string | number | boolean | null
    ) => {
      steps.push({
        engine: 'array-pointers',
        caption,
        line,
        vars,
        array: {
          values: [...chars],
          pointers,
          ranges: range ? [range] : undefined,
          marks,
          result,
        },
      });
    };

    if (m === 0) {
      record('Pattern is empty. Matches at index 0.', 11, [], {}, undefined, { result: 0 }, 0);
      return steps;
    }

    const Z: number[] = new Array(n).fill(0);
    let L = 0;
    let R = 0;

    record(
      `Constructed concatenated string S = pattern ("${pattern}") + "$" + text ("${text}"). Total length = ${n}.`,
      2,
      [{ name: 'delim "$"', index: m, color: 'accent' }],
      { [m]: 'checking' },
      { from: 0, to: m - 1, label: `Pattern: "${pattern}"` },
      { S, patternLength: m, textLength: text.length }
    );

    for (let i = 1; i < n; i++) {
      const currentMarks: Record<number, ArrayCellMark> = {};
      if (L <= R && R > 0) {
        for (let k = L; k <= R; k++) currentMarks[k] = 'window';
      }
      currentMarks[i] = 'checking';

      const pointers: ArrayPointer[] = [
        ...(R > 0 ? [{ name: 'L', index: L, color: 'primary' as const }, { name: 'R', index: R, color: 'primary' as const }] : []),
        { name: 'i', index: i, color: 'accent' as const },
      ];

      if (i > R) {
        L = i;
        R = i;
        while (R < n && chars[R - L] === chars[R]) {
          R++;
        }
        Z[i] = R - L;
        R--;

        record(
          `Index i=${i} > R (${R}): compare directly with prefix. Matched Z[${i}] = ${Z[i]} chars. New [L, R] = [${L}, ${R}].`,
          5,
          pointers,
          currentMarks,
          R >= L ? { from: L, to: R, label: `Z-box: len ${Z[i]}` } : undefined,
          { i, L, R, 'Z[i]': Z[i] }
        );
      } else {
        const k = i - L;
        if (Z[k] < R - i + 1) {
          Z[i] = Z[k];
          record(
            `Inside Z-box: k = i - L = ${k}. Z[k]=${Z[k]} < remaining room (${R - i + 1}). Copy Z[${i}] := ${Z[k]} in O(1).`,
            8,
            pointers,
            currentMarks,
            { from: L, to: R, label: `Z-box [${L}..${R}]` },
            { i, k, 'Z[k]': Z[k], 'Z[i]': Z[i], L, R }
          );
        } else {
          L = i;
          while (R < n && chars[R - L] === chars[R]) {
            R++;
          }
          Z[i] = R - L;
          R--;

          record(
            `Inside Z-box: prefix reaches beyond R. Extended Z-box: Z[${i}] = ${Z[i]}, new [L, R] = [${L}, ${R}].`,
            9,
            pointers,
            currentMarks,
            R >= L ? { from: L, to: R, label: `Expanded Z-box [${L}..${R}]` } : undefined,
            { i, L, R, 'Z[i]': Z[i] }
          );
        }
      }

      // Check if match in text region (i > m)
      if (i > m && Z[i] === m) {
        const textMatchIndex = i - m - 1;
        const matchMarks: Record<number, ArrayCellMark> = {};
        for (let idx = i; idx < i + m; idx++) matchMarks[idx] = 'found';

        record(
          `Pattern match discovered! Z[${i}] = ${m} matches pattern length "${pattern}". Corresponding text index = ${textMatchIndex}.`,
          11,
          [
            { name: 'match_start', index: i, color: 'accent' },
            { name: 'match_end', index: i + m - 1, color: 'accent' },
          ],
          matchMarks,
          { from: i, to: i + m - 1, label: `Match in text: "${pattern}"` },
          { S_index: i, textIndex: textMatchIndex, pattern, result: textMatchIndex },
          textMatchIndex
        );
        return steps;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `Z-array computation complete. No index reached pattern length ${m}. Pattern "${pattern}" not found in text. Return -1.`,
      11,
      [],
      allEliminated,
      undefined,
      { pattern, result: -1 },
      -1
    );

    return steps;
  },
};

export default zAlgorithmDefinition;
