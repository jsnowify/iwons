/**
 * Iwons Algorithm Visualizer - Safe Input Parsers and Seeded Generators
 *
 * Validates, sanitizes, and clamps user inputs for each input kind.
 * Never throws uncaught errors, never evals input, provides user-friendly error messages.
 */

import { InputKind } from './types';

export interface ParseResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}

export interface TargetAndNumbers {
  target: number;
  numbers: number[];
}

export interface PatternMatchInput {
  text: string;
  pattern: string;
}

export interface GraphEdgeInput {
  source: string;
  target: string;
  weight?: number;
}

export interface GraphDataInput {
  nodes: string[];
  edges: GraphEdgeInput[];
  directed?: boolean;
  startNode?: string;
  targetNode?: string;
}

export interface GridDataInput {
  rows: number;
  cols: number;
  grid: number[][]; // 0 = open, 1 = obstacle/wall
  start?: [number, number];
  target?: [number, number];
}

/* Deterministic Seeded PRNG (xorshift32) */
export function createRng(initialSeed: number = 42) {
  let s = (initialSeed <= 0 ? 1 : initialSeed) >>> 0;
  return function next(): number {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * Parses comma- or space-separated numbers with limits.
 */
export function parseNumberList(
  input: string,
  minCount: number = 1,
  maxCount: number = 40,
  minVal: number = -999,
  maxVal: number = 999
): ParseResult<number[]> {
  if (!input || !input.trim()) {
    return { success: false, error: 'Please enter at least one number.' };
  }

  const parts = input
    .replace(/[\[\]]/g, '')
    .split(/[\s,]+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { success: false, error: 'No numbers found in input.' };
  }

  const numbers: number[] = [];
  for (const p of parts) {
    const num = Number(p);
    if (!Number.isFinite(num)) {
      return { success: false, error: `Invalid number: "${p}". Please enter numeric values only.` };
    }
    const clamped = Math.max(minVal, Math.min(maxVal, Math.round(num)));
    numbers.push(clamped);
  }

  if (numbers.length < minCount) {
    return { success: false, error: `At least ${minCount} numbers are required.` };
  }

  if (numbers.length > maxCount) {
    return {
      success: true,
      value: numbers.slice(0, maxCount),
      error: `Input clamped to maximum ${maxCount} numbers.`,
    };
  }

  return { success: true, value: numbers };
}

/**
 * Parses Target and Number list.
 * Format: "target: 23; list: 4, 8, 15, 23, 42" or "23 | 4, 8, 15, 23, 42"
 */
export function parseTargetAndNumbers(
  input: string,
  minCount: number = 1,
  maxCount: number = 30
): ParseResult<TargetAndNumbers> {
  if (!input || !input.trim()) {
    return { success: false, error: 'Please enter a target and a list of numbers.' };
  }

  let targetStr = '';
  let listStr = input;

  if (input.includes('|')) {
    const parts = input.split('|');
    targetStr = parts[0].trim();
    listStr = parts[1]?.trim() ?? '';
  } else if (input.toLowerCase().includes('target') && input.includes(';')) {
    const parts = input.split(';');
    for (const part of parts) {
      const [k, v] = part.split(/[:=]/).map(s => s.trim());
      if (k.toLowerCase().includes('target')) targetStr = v;
      if (k.toLowerCase().includes('list') || k.toLowerCase().includes('array')) listStr = v;
    }
  } else {
    // Default: first item is target, rest is array
    const parts = input.split(/[\s,]+/);
    targetStr = parts[0];
    listStr = parts.slice(1).join(', ');
  }

  const targetNum = Number(targetStr);
  if (!Number.isFinite(targetNum)) {
    return { success: false, error: `Invalid target: "${targetStr}". Must be a valid number.` };
  }

  const parsedList = parseNumberList(listStr, minCount, maxCount);
  if (!parsedList.success || !parsedList.value) {
    return { success: false, error: parsedList.error ?? 'Invalid numbers list.' };
  }

  return {
    success: true,
    value: {
      target: targetNum,
      numbers: parsedList.value,
    },
    error: parsedList.error,
  };
}

/**
 * Parses text and pattern.
 * Format: "text: AABAACAADAABAABA; pattern: AABA" or "AABAACAADAABAABA | AABA"
 */
export function parsePatternMatch(
  input: string,
  maxTextLen: number = 40,
  maxPatternLen: number = 12
): ParseResult<PatternMatchInput> {
  if (!input || !input.trim()) {
    return { success: false, error: 'Please enter text and a search pattern.' };
  }

  let text = '';
  let pattern = '';

  if (input.includes('|')) {
    const parts = input.split('|');
    text = parts[0].trim();
    pattern = parts[1]?.trim() ?? '';
  } else if (input.includes(';')) {
    const parts = input.split(';');
    for (const part of parts) {
      const [k, v] = part.split(/[:=]/).map(s => s.trim());
      if (k.toLowerCase().includes('text')) text = v ?? '';
      if (k.toLowerCase().includes('pat')) pattern = v ?? '';
    }
  } else {
    const words = input.trim().split(/\s+/);
    text = words[0] ?? '';
    pattern = words[1] ?? '';
  }

  if (!text) return { success: false, error: 'Text string cannot be empty.' };
  if (!pattern) return { success: false, error: 'Pattern string cannot be empty.' };

  const clampedText = text.slice(0, maxTextLen);
  const clampedPattern = pattern.slice(0, maxPatternLen);

  return {
    success: true,
    value: { text: clampedText, pattern: clampedPattern },
    error: text.length > maxTextLen || pattern.length > maxPatternLen
      ? `Input trimmed to text max ${maxTextLen} chars and pattern max ${maxPatternLen} chars.`
      : undefined,
  };
}

/**
 * Parses a simple graph edge list.
 * Format: "A-B, B-C, C-D, A-C" or with weights "A-B:4, B-C:2"
 */
export function parseGraphEdges(
  input: string,
  maxNodes: number = 12,
  maxEdges: number = 24
): ParseResult<GraphDataInput> {
  if (!input || !input.trim()) {
    return { success: false, error: 'Please enter edge pairs like A-B, B-C.' };
  }

  const rawEdges = input.split(/[,;\n]+/).map(e => e.trim()).filter(Boolean);
  const nodeSet = new Set<string>();
  const edges: GraphEdgeInput[] = [];

  for (const raw of rawEdges) {
    // Check for weight suffix: A-B:5 or A->B:5
    const [conn, weightPart] = raw.split(':');
    const isDirected = conn.includes('->');
    const pair = conn.split(/->|-/).map(s => s.trim()).filter(Boolean);
    if (pair.length < 2) continue;

    const [u, v] = pair;
    if (nodeSet.size >= maxNodes && (!nodeSet.has(u) || !nodeSet.has(v))) {
      continue; // Clamp total nodes
    }
    nodeSet.add(u);
    nodeSet.add(v);

    const weight = weightPart ? Number(weightPart.trim()) : undefined;
    edges.push({
      source: u,
      target: v,
      weight: Number.isFinite(weight) ? weight : undefined,
    });

    if (edges.length >= maxEdges) break;
  }

  const nodes = Array.from(nodeSet);
  if (nodes.length < 2 || edges.length === 0) {
    return { success: false, error: 'At least 2 connected nodes are required (e.g. A-B, B-C).' };
  }

  return {
    success: true,
    value: {
      nodes,
      edges,
      startNode: nodes[0],
      targetNode: nodes[nodes.length - 1],
    },
  };
}

/**
 * Parses 2D Grid input.
 * Format: lines of 0s and 1s, or comma-separated rows.
 */
export function parseGridInput(
  input: string,
  maxRows: number = 8,
  maxCols: number = 8
): ParseResult<GridDataInput> {
  if (!input || !input.trim()) {
    return { success: false, error: 'Please enter grid rows (0 for open, 1 for obstacle).' };
  }

  const lines = input.trim().split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { success: false, error: 'Empty grid.' };

  const parsedGrid: number[][] = [];
  let cols = -1;

  for (let r = 0; r < Math.min(lines.length, maxRows); r++) {
    const rowTokens = lines[r].split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    const rowNumbers = rowTokens.map(t => (t === '1' || t === '■' || t === '#' ? 1 : 0));
    if (cols === -1) cols = Math.min(rowNumbers.length, maxCols);
    parsedGrid.push(rowNumbers.slice(0, cols));
  }

  if (parsedGrid.length < 2 || cols < 2) {
    return { success: false, error: 'Grid must be at least 2x2.' };
  }

  return {
    success: true,
    value: {
      rows: parsedGrid.length,
      cols,
      grid: parsedGrid,
      start: [0, 0],
      target: [parsedGrid.length - 1, cols - 1],
    },
  };
}

/* Preset Generators with Reproducible Seeds */
export function generateRandomNumbers(count: number, min: number = 5, max: number = 95, seed: number = 101): number[] {
  const rng = createRng(seed);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.floor(min + rng() * (max - min + 1)));
  }
  return result;
}

export function generateSortedNumbers(count: number, min: number = 5, step: number = 6): number[] {
  const result: number[] = [];
  let curr = min;
  for (let i = 0; i < count; i++) {
    result.push(curr);
    curr += step;
  }
  return result;
}

export function generateReversedNumbers(count: number, max: number = 90, step: number = 5): number[] {
  const result: number[] = [];
  let curr = max;
  for (let i = 0; i < count; i++) {
    result.push(curr);
    curr -= step;
  }
  return result;
}

export function generateNearlySortedNumbers(count: number, seed: number = 202): number[] {
  const arr = generateSortedNumbers(count, 10, 5);
  const rng = createRng(seed);
  // Swap 2 or 3 adjacent pairs
  const swaps = Math.max(1, Math.floor(count / 5));
  for (let s = 0; s < swaps; s++) {
    const idx = Math.floor(rng() * (count - 1));
    const temp = arr[idx];
    arr[idx] = arr[idx + 1];
    arr[idx + 1] = temp;
  }
  return arr;
}

export function generateDuplicateNumbers(count: number, uniqueCount: number = 4, seed: number = 303): number[] {
  const rng = createRng(seed);
  const pool = [12, 28, 45, 60, 77, 91].slice(0, uniqueCount);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(rng() * pool.length)]);
  }
  return result;
}

