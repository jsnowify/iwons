/**
 * Knuth-Morris-Pratt (KMP) - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { PatternMatchInput } from '../../core/inputs';

export const kmpStringMatchDefinition: AlgoDefinition<PatternMatchInput> = {
  id: 'kmp-string-match',
  name: 'Knuth-Morris-Pratt (KMP)',
  category: 'strings',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n)',
    average: 'O(n + m)',
    worst: 'O(n + m)',
    space: 'O(m)',
  },
  inputKind: 'pattern-match',
  blurb: 'Linear-time string searching algorithm that uses a precomputed longest-proper-prefix-which-is-also-suffix (pi / LPS) table to avoid backtracking in the text upon character mismatches.',
  pseudocode: [
    'procedure kmpSearch(text, pattern):',
    '  pi := computeLpsTable(pattern)',
    '  i := 0, j := 0',
    '  while i < length(text) do:',
    '    if text[i] = pattern[j] then i := i + 1, j := j + 1',
    '    if j = length(pattern) then return i - j // match found',
    '    else if i < length(text) and text[i] != pattern[j] then:',
    '      if j != 0 then j := pi[j - 1]',
    '      else i := i + 1',
    '  return -1',
  ],
  presets: [
    {
      name: 'ababc-match',
      label: 'Pattern ABABC in ABABDABABC',
      description: 'LPS shifts pattern without backtracking text index.',
      input: { text: 'ABABDABABC', pattern: 'ABABC' },
    },
    {
      name: 'repeated-prefix',
      label: 'Pattern AAAA in AAAAAAAA',
      description: 'Overlapping matching segments demonstrating maximal LPS reuse.',
      input: { text: 'BAAAAAAB', pattern: 'AAAA' },
    },
    {
      name: 'no-match',
      label: 'Pattern Missing (XYZ)',
      description: 'Pattern does not exist anywhere in text.',
      input: { text: 'ABCDEFGHIJ', pattern: 'XYZ' },
    },
  ],
  generate(input: PatternMatchInput): ArrayPointersStep[] {
    const text = input.text || 'ABABDABABC';
    const pattern = input.pattern || 'ABABC';
    const textChars = text.split('');
    const patternChars = pattern.split('');
    const steps: ArrayPointersStep[] = [];
    const n = textChars.length;
    const m = patternChars.length;

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
          values: [...textChars],
          pointers,
          ranges: range ? [range] : undefined,
          marks,
          result,
        },
      });
    };

    if (m === 0) {
      record('Pattern is empty string. Matches at index 0.', 6, [], {}, undefined, { result: 0 }, 0);
      return steps;
    }

    if (n === 0 || n < m) {
      record(`Text is shorter than pattern (${n} < ${m}). No match possible.`, 10, [], {}, undefined, { result: -1 }, -1);
      return steps;
    }

    // Step 1: Precompute LPS table
    const pi: number[] = new Array(m).fill(0);
    let len = 0;
    let pIdx = 1;

    while (pIdx < m) {
      if (patternChars[pIdx] === patternChars[len]) {
        len++;
        pi[pIdx] = len;
        pIdx++;
      } else {
        if (len !== 0) {
          len = pi[len - 1];
        } else {
          pi[pIdx] = 0;
          pIdx++;
        }
      }
    }

    record(
      `Precomputed LPS (pi) table for pattern "${pattern}": [${pi.join(', ')}]. Starting KMP scan on text.`,
      2,
      [{ name: 'i', index: 0, color: 'accent' }],
      {},
      undefined,
      { pattern, piTable: pi.join(', '), textLength: n, patternLength: m }
    );

    let i = 0;
    let j = 0;
    const matchedMarks: Record<number, ArrayCellMark> = {};

    while (i < n) {
      const currentMarks: Record<number, ArrayCellMark> = { ...matchedMarks };
      currentMarks[i] = 'checking';

      const windowStart = i - j;
      const windowEnd = i;

      record(
        `Compare text[${i}]='${textChars[i]}' with pattern[${j}]='${patternChars[j]}'. (Alignment at index ${windowStart}).`,
        5,
        [
          { name: `i (text)`, index: i, color: 'accent' },
          { name: `j=${j} ("${patternChars[j]}")`, index: i, color: 'primary' },
        ],
        currentMarks,
        { from: windowStart, to: windowEnd, label: `Aligned: "${pattern.slice(0, j + 1)}"` },
        { i, j, 'text[i]': textChars[i], 'pattern[j]': patternChars[j], alignment: windowStart }
      );

      if (textChars[i] === patternChars[j]) {
        matchedMarks[i] = 'window';
        i++;
        j++;

        if (j === m) {
          const foundStart = i - m;
          const foundMarks: Record<number, ArrayCellMark> = {};
          for (let k = foundStart; k < i; k++) foundMarks[k] = 'found';

          record(
            `Complete pattern match found! Pattern "${pattern}" matches text at index ${foundStart}.`,
            6,
            [
              { name: 'start', index: foundStart, color: 'accent' },
              { name: 'end', index: i - 1, color: 'accent' },
            ],
            foundMarks,
            { from: foundStart, to: i - 1, label: `Full Match: "${pattern}"` },
            { foundIndex: foundStart, pattern, result: foundStart },
            foundStart
          );
          return steps;
        }
      } else {
        currentMarks[i] = 'eliminated';
        if (j !== 0) {
          const prevJ = j;
          j = pi[j - 1];
          record(
            `Mismatch at pattern index ${prevJ}. Fall back to pi[${prevJ - 1}] = ${j} without backtracking text pointer i=${i}.`,
            8,
            [
              { name: 'i', index: i, color: 'accent' },
              { name: `j->${j}`, index: i, color: 'primary' },
            ],
            currentMarks,
            { from: i - j, to: i, label: `Shifted alignment` },
            { i, old_j: prevJ, new_j: j, 'pi[j-1]': j }
          );
        } else {
          record(
            `Mismatch at first character of pattern (j=0). Advance text index i to ${i + 1}.`,
            9,
            [{ name: 'i', index: i, color: 'neutral' }],
            currentMarks,
            undefined,
            { i, j: 0 }
          );
          i++;
        }
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `End of text reached. Pattern "${pattern}" was not found. Return -1.`,
      10,
      [],
      allEliminated,
      undefined,
      { pattern, result: -1 },
      -1
    );

    return steps;
  },
};

export default kmpStringMatchDefinition;
