/**
 * Iwons Algorithm Visualizer - Core Type Definitions
 * 
 * Strict, discriminated union types for the 6 reusable engines,
 * the step recorder pattern, algorithm definitions, and player contracts.
 */

export type EngineType =
  | 'bars'
  | 'array-pointers'
  | 'grid-table'
  | 'graph'
  | 'tree-heap'
  | 'nodes-arrows';

export type AlgorithmCategory =
  | 'sorting'
  | 'searching'
  | 'arrays'
  | 'strings'
  | 'dynamic-programming'
  | 'matrices'
  | 'backtracking'
  | 'graphs'
  | 'trees'
  | 'heaps'
  | 'linked-lists'
  | 'stacks-queues'
  | 'hashing'
  | 'greedy'
  | 'divide-and-conquer'
  | 'math'
  | 'bit-manipulation'
  | 'geometry';

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export type InputKind =
  | 'numbers'
  | 'target-and-numbers'
  | 'string'
  | 'pattern-match'
  | 'grid'
  | 'graph'
  | 'tree'
  | 'key-values';

export interface StepBase {
  caption: string;
  line: number; // 1-indexed pseudocode line number (0 = no highlight/preamble)
  vars?: Record<string, string | number | boolean>;
}

/* Engine 1: Bars (Sorting) */
export type BarMark = 'compared' | 'swapped' | 'sorted' | 'pivot' | 'range' | 'selected';

export interface BarsStep extends StepBase {
  engine: 'bars';
  bars: {
    values: number[];
    marks?: Record<number, BarMark>;
    counters?: { comparisons?: number; swaps?: number };
    auxiliary?: { label: string; values: (number | null)[] };
  };
}

/* Engine 2: Array & Pointers (Search, Sliding Window, Strings, Two Pointers) */
export type ArrayPointerColor = 'primary' | 'secondary' | 'accent' | 'warning' | 'neutral';
export type ArrayCellMark = 'found' | 'checking' | 'window' | 'eliminated' | 'match' | 'mismatch';

export interface ArrayPointer {
  name: string;
  index: number;
  color?: ArrayPointerColor;
}

export interface ArrayRange {
  from: number;
  to: number;
  label?: string;
}

export interface ArrayPointersStep extends StepBase {
  engine: 'array-pointers';
  array: {
    values: (number | string)[];
    pointers: ArrayPointer[];
    ranges?: ArrayRange[];
    marks?: Record<number, ArrayCellMark>;
    result?: string | number | boolean | null;
    auxiliaryRow?: { label: string; values: (number | string | null)[] };
  };
}

/* Engine 3: Grid & Table (DP, Matrices, Backtracking) */
export type GridCellMark = 'current' | 'visited' | 'path' | 'wall' | 'candidate' | 'computed' | 'source';

export interface GridCell {
  r: number;
  c: number;
  value: string | number;
  mark?: GridCellMark;
}

export interface GridTableStep extends StepBase {
  engine: 'grid-table';
  grid: {
    rows: number;
    cols: number;
    cells: GridCell[];
    rowLabels?: string[];
    colLabels?: string[];
    tracebackPath?: [number, number][];
    auxiliary?: string;
  };
}

/* Engine 4: Graph (SVG Layout, Shortest Paths, MST, Traversals) */
export type GraphNodeMark = 'current' | 'visited' | 'frontier' | 'finished' | 'path' | 'unvisited';
export type GraphEdgeMark = 'tree' | 'back' | 'cross' | 'active' | 'in-path' | 'visited' | 'candidate';

export interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  mark?: GraphNodeMark;
  distance?: string | number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number | string;
  mark?: GraphEdgeMark;
  directed?: boolean;
}

export interface GraphStep extends StepBase {
  engine: 'graph';
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    queueOrStack?: { type: 'queue' | 'stack' | 'priority-queue'; items: string[] };
    visitedOrder?: string[];
  };
}

/* Engine 5: Tree & Heap (Binary Trees, Traversals, AVL, Tries, Heaps) */
export type TreeNodeMark = 'current' | 'visited' | 'inserted' | 'highlight' | 'rotated';
export type HeapCellMark = 'current' | 'swapped' | 'sorted' | 'parent';

export interface TreeNode {
  id: string;
  val: string | number;
  left?: string;
  right?: string;
  mark?: TreeNodeMark;
  x?: number;
  y?: number;
  depth?: number;
}

export interface HeapCell {
  index: number;
  val: number | string;
  mark?: HeapCellMark;
}

export interface CallStackFrame {
  label: string;
  args?: string;
  returnValue?: string;
}

export interface TreeHeapStep extends StepBase {
  engine: 'tree-heap';
  tree: {
    treeNodes: TreeNode[];
    rootId?: string | null;
    heapArray?: HeapCell[];
    callStack?: CallStackFrame[];
  };
}

/* Engine 6: Nodes & Arrows (Linked Lists, LRU, Hashing, Stacks & Queues) */
export type NodeArrowMark = 'current' | 'active' | 'target' | 'removed' | 'added';

export interface LinkedNode {
  id: string;
  val: string | number;
  next?: string | null;
  prev?: string | null;
  mark?: NodeArrowMark;
}

export interface NodePointer {
  name: string;
  nodeId: string;
}

export interface HashBucket {
  index: number;
  nodeIds: string[];
}

export interface NodesArrowsStep extends StepBase {
  engine: 'nodes-arrows';
  nodesArrows: {
    nodes: LinkedNode[];
    headId?: string | null;
    tailId?: string | null;
    pointers?: NodePointer[];
    buckets?: HashBucket[];
    cacheList?: string[];
  };
}

export type Step =
  | BarsStep
  | ArrayPointersStep
  | GridTableStep
  | GraphStep
  | TreeHeapStep
  | NodesArrowsStep;

export interface AlgoPreset<T = unknown> {
  name: string;
  label: string;
  description?: string;
  input: T;
}

export interface AlgoMetadata {
  id: string;
  name: string;
  category: AlgorithmCategory;
  engine: EngineType;
  complexity: Complexity;
  inputKind: InputKind;
  blurb: string;
}

export interface AlgoDefinition<T = unknown> extends AlgoMetadata {
  pseudocode: string[];
  presets: AlgoPreset<T>[];
  generate: (input: T) => Step[];
}

export const MAX_FRAMES_CAP = 5000;

