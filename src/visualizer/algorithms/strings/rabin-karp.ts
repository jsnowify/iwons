/**
 * Rabin-Karp String Match - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';
import { PatternMatchInput } from '../../core/inputs';

export const rabinKarpDefinition: AlgoDefinition<PatternMatchInput> = {
  id: 'rabin-karp',
  name: 'Rabin-Karp String Match',
  category: 'strings',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n + m)',
    average: 'O(n + m)',
    worst: 'O(n · m)',
    space: 'O(1)',
  },
  inputKind: 'pattern-match',
  blurb: 'Uses a rolling hash function to quickly filter out positions in the text that cannot match the pattern, only checking character-by-character when hash values match.',
  pseudocode: [
    'procedure rabinKarp(text, pattern):',
    '  pHash := hash(pattern)',
    '  wHash := hash(text[0..m-1])',
    '  for i := 0 to n - m do:',
    '    if wHash = pHash and text[i..i+m-1] = pattern then:',
    '      return i  // match found',
    '    wHash := rollHash(wHash, text[i], text[i + m])',
    '  return -1',
  ],
  presets: [
    {
      name: 'direct-match',
      label: 'Pattern CODE in TEXTCODEFUN',
      description: 'Matches after rolling through initial characters.',
      input: { text: 'TEXTCODEFUN', pattern: 'CODE' },
    },
    {
      name: 'repeated-chars',
      label: 'Repeated Pattern (ABBA)',
      description: 'Rolling hash updates efficiently across recurring characters.',
      input: { text: 'CBAABBABBA', pattern: 'ABBA' },
    },
    {
      name: 'hash-mismatch',
      label: 'No Match (XYZ)',
      description: 'Hash comparisons quickly reject every candidate window.',
      input: { text: 'HELLOWORLD', pattern: 'XYZ' },
    },
  ],
  generate(input: PatternMatchInput): ArrayPointersStep[] {
    const text = input.text || 'TEXTCODEFUN';
    const pattern = input.pattern || 'CODE';
    const textChars = text.split('');
    const steps: ArrayPointersStep[] = [];
    const n = textChars.length;
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

    if (n < m) {
      record(`Text (${n}) is shorter than pattern (${m}). Return -1.`, 8, [], {}, undefined, { result: -1 }, -1);
      return steps;
    }

    const base = 31;
    const mod = 1000000007;

    // Compute base^(m-1) % mod
    let h = 1;
    for (let k = 0; k < m - 1; k++) {
      h = (h * base) % mod;
    }

    // Compute pattern hash and initial window hash
    let pHash = 0;
    let wHash = 0;
    for (let k = 0; k < m; k++) {
      pHash = (pHash * base + pattern.charCodeAt(k)) % mod;
      wHash = (wHash * base + text.charCodeAt(k)) % mod;
    }

    record(
      `Computed initial hashes: pattern "${pattern}" hash = ${pHash}. First window text[0..${m - 1}] hash = ${wHash}.`,
      2,
      [
        { name: 'start', index: 0, color: 'primary' },
        { name: 'end', index: m - 1, color: 'accent' },
      ],
      {},
      { from: 0, to: m - 1, label: `wHash: ${wHash}` },
      { pHash, wHash, pattern }
    );

    for (let i = 0; i <= n - m; i++) {
      const windowMarks: Record<number, ArrayCellMark> = {};
      for (let k = 0; k < i; k++) windowMarks[k] = 'eliminated';
      for (let k = i; k < i + m; k++) windowMarks[k] = 'window';

      const pointers: ArrayPointer[] = [
        { name: 'i', index: i, color: 'primary' },
        { name: 'end', index: i + m - 1, color: 'accent' },
      ];

      record(
        `Window [${i}..${i + m - 1}]: candidate substring "${text.slice(i, i + m)}" with hash ${wHash}. Compare with pattern hash ${pHash}.`,
        4,
        pointers,
        windowMarks,
        { from: i, to: i + m - 1, label: `Hash: ${wHash} vs ${pHash}` },
        { i, candidate: text.slice(i, i + m), wHash, pHash }
      );

      if (wHash === pHash) {
        // Full string check to verify against hash collision
        const sub = text.slice(i, i + m);
        if (sub === pattern) {
          const foundMarks: Record<number, ArrayCellMark> = {};
          for (let k = i; k < i + m; k++) foundMarks[k] = 'found';

          record(
            `Hash match confirmed! Substring "${sub}" matches pattern "${pattern}". Return index ${i}.`,
            5,
            pointers,
            foundMarks,
            { from: i, to: i + m - 1, label: `Match: "${pattern}"` },
            { foundIndex: i, pattern, result: i },
            i
          );
          return steps;
        } else {
          record(
            `Spurious hash collision! Hashes match (${wHash}) but characters differ ("${sub}" ≠ "${pattern}"). Continue sliding.`,
            6,
            pointers,
            windowMarks,
            undefined,
            { collision: true, i, sub, pattern }
          );
        }
      }

      // Roll hash to next window
      if (i < n - m) {
        const outgoing = text.charCodeAt(i);
        const incoming = text.charCodeAt(i + m);
        wHash = (base * (wHash - outgoing * h) + incoming) % mod;
        if (wHash < 0) wHash += mod;
      }
    }

    const allEliminated: Record<number, ArrayCellMark> = {};
    for (let k = 0; k < n; k++) allEliminated[k] = 'eliminated';

    record(
      `All windows evaluated without finding pattern "${pattern}". Return -1.`,
      8,
      [],
      allEliminated,
      undefined,
      { pattern, result: -1 },
      -1
    );

    return steps;
  },
};

export default rabinKarpDefinition;

