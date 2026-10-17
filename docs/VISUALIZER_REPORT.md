# Iwons Algorithm Visualizer Rebuild: Comprehensive Final Report

**Date:** 2026-10-17  
**Authors:** Principal Software Engineer & Senior QA Engineer  
**Status:** Complete & Production-Verified  

---

## 1. Executive Summary

The Iwons Visualizer has been completely rebuilt from the ground up into a unified, extensible algorithmic workbench.

### What Was Replaced
- **Monolithic HTML DOM Grid Cells:** The legacy visualizer rendered elements as heavy flex/grid DOM cards with inline styles that caused excessive layout recalculations and 989px vertical overflowing on mobile viewports.
- **Hardcoded 9-Algorithm Registry:** All 9 legacy algorithms were bundled eagerly in a single component file (`visualizers.ts`), inflating initial route payload and preventing scalability.
- **Absence of Memory/Pointer Inspection:** The legacy UI displayed only a single raw state string without structured variable tracking or pseudocode line highlighting.
- **Ad-Hoc Playback State:** Playback was driven by unstable interval timers prone to leaks, race conditions on rapid scrubbing, and unmount crashes.

### What Was Kept & Standardized
- **Pure Browser Execution:** Zero backend or database dependencies; all algorithm generators and static HTML pages execute client-side or build at static export.
- **Design Tokens:** Strict adherence to `src/styles/tokens.css` Paper and Night palettes (`--ink`, `--paper`, `--surface`, `--accent`, `--border-dim`), retro typewriter typography, and connected double borders.
- **Non-blocking Audio Synthesizer:** Subtle Web Audio oscillator feedback with strict user gesture unlock and per-visit mute persistence.

### Why This Architecture
Instead of authoring 250 individual animation components with disparate UI logic, the entire system is founded on **6 reusable SVG engines** driven by the **Pure Step Recorder Pattern** (`generate(input) => Step[]`). Adding a new algorithm requires writing only a pure data generator file and adding a metadata entry in the registry.

```
┌─────────────────────────────────────────────────────────────┐
│                       UI / SHELL LAYER                      │
│   VisualizerShell  ·  VisualizerTopBar  ·  VisualizerDock   │
│   SidePanel (Caption, Pseudocode, Variable Inspector)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Dispatches Step
┌──────────────────────────────▼──────────────────────────────┐
│                    6 REUSABLE SVG ENGINES                   │
│  1. Bars  2. Array & Pointers  3. Grid & Table              │
│  4. Graph  5. Tree & Heap  6. Nodes & Arrows                │
└──────────────────────────────▲──────────────────────────────┘
                               │ Emits Steps[]
┌──────────────────────────────┴──────────────────────────────┐
│                    ALGORITHM DATA MODULES                   │
│   Pure generators (Bubble, Quick, Dijkstra, AVL, LRU...)    │
│   Dynamic imports via loadAlgorithmDefinition(slug)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Before-and-After Metrics

| Metric | Legacy Baseline (Phase V0) | Rebuilt System (Phase V12) | Improvement / Difference |
| :--- | :--- | :--- | :--- |
| **Number of Algorithms** | 9 algorithms | **67 algorithms** across 15 categories | **+644% library coverage** |
| **Rendering Architecture** | Heavy HTML `<div>` cards | **6 Reusable SVG Engines** | Crisp vectors, sub-pixel scaling, zero layout shift |
| **Mobile Stage Height** | 989 px (broken overflow) | **Bounded 240px–48dvh** | Fits cleanly on 360px & 390px viewports without scroll trap |
| **Catalog Page Payload** | 628 KB eager bundle | **100 KB static HTML** | Lightweight metadata; zero generator code loaded eagerly |
| **Algorithm Route Payload** | N/A (single page only) | **28.4 KB avg static HTML** | 67 statically generated SSG routes via `generateStaticParams` |
| **Code Splitting** | Single monolithic chunk | **Isolated chunk per algorithm** | Opening an algorithm fetches only its ~3KB generator chunk |
| **Unit Test Coverage** | 9 basic tests | **148 dedicated algorithm tests** (748 total suite) | Dual-oracle property testing across edge cases |
| **E2E Playwright Suite** | 1 test file (legacy) | **4 multi-viewport tests** (390, 1024, 1440px) | Passing across Paper & Night themes |
| **Scrubbing & Stepping** | Jittery recalculation | **O(1) Instantaneous Scrubbing** | Precomputed frame snapshots enable instant jump |
| **External Dependencies** | 0 external libraries | **0 external libraries** | Pure SVG, CSS transforms, and standard React 19 |

---

## 3. Complete Library Inventory (67 Algorithms)

### Engine 1: Bars (Sorting, Math, Greedy - 18 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Bubble Sort** | Sorting | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Selection Sort** | Sorting | $O(n^2)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Insertion Sort** | Sorting | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Merge Sort** | Sorting | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(n)$ | `src/tests/sorting-algorithms.test.ts` |
| **Quicksort (Lomuto)** | Sorting | $O(n \log n)$ / $O(n \log n)$ / $O(n^2)$ | $O(\log n)$ | `src/tests/sorting-algorithms.test.ts` |
| **Heap Sort** | Sorting | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Counting Sort** | Sorting | $O(n + k)$ / $O(n + k)$ / $O(n + k)$ | $O(k)$ | `src/tests/sorting-algorithms.test.ts` |
| **Radix Sort (LSD)** | Sorting | $O(d(n+b))$ / $O(d(n+b))$ / $O(d(n+b))$ | $O(n+b)$ | `src/tests/sorting-algorithms.test.ts` |
| **Bucket Sort** | Sorting | $O(n+k)$ / $O(n+k)$ / $O(n^2)$ | $O(n+k)$ | `src/tests/sorting-algorithms.test.ts` |
| **Shell Sort (Ciura gaps)**| Sorting | $O(n \log n)$ / $O(n^{4/3})$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Cocktail Shaker Sort**| Sorting | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Comb Sort** | Sorting | $O(n \log n)$ / $O(n^2/2^p)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Gnome Sort** | Sorting | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Tim Sort** | Sorting | $O(n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(n)$ | `src/tests/sorting-algorithms.test.ts` |
| **Cycle Sort** | Sorting | $O(n^2)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Pancake Sort** | Sorting | $O(n)$ / $O(n^2)$ / $O(n^2)$ | $O(1)$ | `src/tests/sorting-algorithms.test.ts` |
| **Fractional Knapsack** | Greedy | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(1)$ | `src/tests/remaining-topics-algorithms.test.ts` |
| **Euclidean GCD** | Math | $O(\log(\min(a, b)))$ | $O(1)$ | `src/tests/remaining-topics-algorithms.test.ts` |

### Engine 2: Array & Pointers (Search, Arrays, Strings, Bits - 19 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Linear Search** | Searching | $O(1)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Binary Search** | Searching | $O(1)$ / $O(\log n)$ / $O(\log n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Jump Search** | Searching | $O(1)$ / $O(\sqrt{n})$ / $O(\sqrt{n})$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Interpolation Search** | Searching | $O(1)$ / $O(\log \log n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Exponential Search** | Searching | $O(1)$ / $O(\log n)$ / $O(\log n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Ternary Search** | Searching | $O(1)$ / $O(\log_3 n)$ / $O(\log_3 n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Two Pointers (Pair Sum)** | Arrays | $O(1)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Fast & Slow Pointers (Floyd)** | Arrays | $O(1)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Sliding Window (Fixed)** | Arrays | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Sliding Window (Variable)**| Arrays | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Prefix Sum Array** | Arrays | $O(n)$ / $O(n)$ / $O(n)$ (query $O(1)$) | $O(n)$ | `src/tests/array-algorithms.test.ts` |
| **Kadane's Algorithm** | Arrays | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Dutch National Flag (3-way)** | Arrays | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Boyer-Moore Majority Vote** | Arrays | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Knuth-Morris-Pratt (KMP)** | Strings | $O(n)$ / $O(n + m)$ / $O(n + m)$ | $O(m)$ | `src/tests/array-algorithms.test.ts` |
| **Rabin-Karp Rolling Hash** | Strings | $O(n + m)$ / $O(n + m)$ / $O(n \cdot m)$ | $O(1)$ | `src/tests/array-algorithms.test.ts` |
| **Z-Algorithm** | Strings | $O(n)$ / $O(n)$ / $O(n)$ | $O(n)$ | `src/tests/array-algorithms.test.ts` |
| **Activity Selection** | Greedy | $O(n \log n)$ / $O(n \log n)$ / $O(n \log n)$ | $O(1)$ | `src/tests/remaining-topics-algorithms.test.ts` |
| **Brian Kernighan Bit Counting** | Bits | $O(1)$ / $O(k)$ / $O(k)$ | $O(1)$ | `src/tests/remaining-topics-algorithms.test.ts` |

### Engine 3: Grid & Table (DP, Matrices, Backtracking, Math - 10 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Fibonacci (Memo & Tabulation)** | DP | $O(n)$ / $O(n)$ / $O(n)$ | $O(n)$ | `src/tests/grid-algorithms.test.ts` |
| **0/1 Knapsack Problem** | DP | $O(n \cdot W)$ / $O(n \cdot W)$ / $O(n \cdot W)$ | $O(n \cdot W)$ | `src/tests/grid-algorithms.test.ts` |
| **Longest Common Subsequence** | DP | $O(n \cdot m)$ / $O(n \cdot m)$ / $O(n \cdot m)$ | $O(n \cdot m)$ | `src/tests/grid-algorithms.test.ts` |
| **Edit Distance (Levenshtein)** | DP | $O(n \cdot m)$ / $O(n \cdot m)$ / $O(n \cdot m)$ | $O(n \cdot m)$ | `src/tests/grid-algorithms.test.ts` |
| **Coin Change (Min Coins)** | DP | $O(n \cdot A)$ / $O(n \cdot A)$ / $O(n \cdot A)$ | $O(A)$ | `src/tests/grid-algorithms.test.ts` |
| **Grid Unique Paths (Obstacles)**| DP | $O(m \cdot n)$ / $O(m \cdot n)$ / $O(m \cdot n)$ | $O(m \cdot n)$ | `src/tests/grid-algorithms.test.ts` |
| **Matrix Spiral Traversal** | Matrices | $O(m \cdot n)$ / $O(m \cdot n)$ / $O(m \cdot n)$ | $O(1)$ | `src/tests/grid-algorithms.test.ts` |
| **N-Queens Backtracking** | Backtracking | $O(N!)$ / $O(N!)$ / $O(N!)$ | $O(N)$ | `src/tests/grid-algorithms.test.ts` |
| **Sudoku Solver** | Backtracking | $O(9^m)$ / $O(9^m)$ / $O(9^m)$ | $O(81)$ | `src/tests/grid-algorithms.test.ts` |
| **Sieve of Eratosthenes** | Math | $O(n \log \log n)$ | $O(n)$ | `src/tests/remaining-topics-algorithms.test.ts` |

### Engine 4: Graph (Traversals, Shortest Paths, MST - 7 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Breadth-First Search (BFS)** | Graphs | $O(V + E)$ / $O(V + E)$ / $O(V + E)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Depth-First Search (DFS)** | Graphs | $O(V + E)$ / $O(V + E)$ / $O(V + E)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Dijkstra's Shortest Path** | Graphs | $O((V+E)\log V)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Bellman-Ford Algorithm** | Graphs | $O(E)$ / $O(V \cdot E)$ / $O(V \cdot E)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Kruskal's MST (DSU)** | Graphs | $O(E \log E)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Prim's MST** | Graphs | $O((V+E)\log V)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |
| **Topological Sort (Kahn's)**| Graphs | $O(V + E)$ | $O(V)$ | `src/tests/graph-algorithms.test.ts` |

### Engine 5: Tree & Heap (Binary Trees, BST, AVL, Heaps - 7 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Binary Tree Inorder** | Trees | $O(n)$ / $O(n)$ / $O(n)$ | $O(h)$ | `src/tests/tree-algorithms.test.ts` |
| **Binary Tree Preorder** | Trees | $O(n)$ / $O(n)$ / $O(n)$ | $O(h)$ | `src/tests/tree-algorithms.test.ts` |
| **Binary Tree Postorder** | Trees | $O(n)$ / $O(n)$ / $O(n)$ | $O(h)$ | `src/tests/tree-algorithms.test.ts` |
| **Binary Tree Level-Order** | Trees | $O(n)$ / $O(n)$ / $O(n)$ | $O(w)$ | `src/tests/tree-algorithms.test.ts` |
| **BST Search & Insertion** | Trees | $O(\log n)$ / $O(\log n)$ / $O(n)$ | $O(h)$ | `src/tests/tree-algorithms.test.ts` |
| **AVL Tree Self-Balancing** | Trees | $O(\log n)$ / $O(\log n)$ / $O(\log n)$ | $O(\log n)$ | `src/tests/tree-algorithms.test.ts` |
| **Binary Heap Operations** | Heaps | $O(1)$ / $O(\log n)$ / $O(\log n)$ | $O(n)$ | `src/tests/tree-algorithms.test.ts` |

### Engine 6: Nodes & Arrows (Lists, Stacks, Queues, Hashing - 6 Algorithms)
| Algorithm | Category | Complexity (Best / Avg / Worst) | Space | Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Reverse Linked List** | Linked Lists | $O(n)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/nodes-algorithms.test.ts` |
| **Linked List Cycle Detection** | Linked Lists | $O(1)$ / $O(n)$ / $O(n)$ | $O(1)$ | `src/tests/nodes-algorithms.test.ts` |
| **Stack Push & Pop** | Stacks & Queues | $O(1)$ / $O(1)$ / $O(1)$ | $O(n)$ | `src/tests/nodes-algorithms.test.ts` |
| **Queue Enqueue & Dequeue** | Stacks & Queues | $O(1)$ / $O(1)$ / $O(1)$ | $O(n)$ | `src/tests/nodes-algorithms.test.ts` |
| **Hash Table Separate Chaining**| Hashing | $O(1)$ / $O(1)$ / $O(n)$ | $O(n)$ | `src/tests/nodes-algorithms.test.ts` |
| **LRU Cache (Map + DLL)** | Hashing | $O(1)$ / $O(1)$ / $O(1)$ | $O(C)$ | `src/tests/nodes-algorithms.test.ts` |

---

## 4. Evidence of Dual-Oracle and Property Testing

Every algorithm generator has been tested against independent oracles and invariant assertions across edge cases:

1. **Sorting Dual-Oracle:**
   - Evaluated against JavaScript native `[...arr].sort((a, b) => a - b)`.
   - Multiset permutation check: guarantees the output is a true permutation of the input (no elements lost, added, or corrupted).
   - Tested edge cases: empty array `[]`, single item `[42]`, duplicates `[5, 5, 5, 5]`, already sorted `[1, 2, 3, 4, 5]`, reverse sorted `[9, 8, 7, 6, 5]`, and negative values `[-10, 0, 5, -2, 14]`.
2. **Search Verification:**
   - Evaluated against `Array.prototype.indexOf()` or binary search oracle across 100 seeded random inputs.
   - Tested targets present at beginning, middle, end, targets smaller than array min, larger than array max, and absent interior values.
3. **Graph Dual-Oracle:**
   - Kruskal and Prim Minimum Spanning Trees were cross-verified on identical randomized connected graphs: both independent algorithms produced mathematically identical total MST weight sums.
   - Dijkstra verified single-source shortest paths on weighted DAGs; Bellman-Ford verified detection of negative weight cycles.
4. **Dynamic Programming Oracles:**
   - Fibonacci verified against closed-form and iterative computations.
   - 0/1 Knapsack, LCS, and Levenshtein Edit Distance verified against pure recursive brute-force solvers with independent memoization tables.
5. **Tree Invariant Verification:**
   - BST Inorder traversal property test: inorder traversal of any valid binary search tree must yield a strictly monotonic non-decreasing sequence.
   - AVL tree height balance invariant: after any sequence of insertions (triggering LL, RR, LR, or RL rotations), $|h_{left} - h_{right}| \le 1$ at every node.
   - Min-heap invariant: for every index $i > 0$, $\text{heap}[\lfloor(i - 1)/2\rfloor] \le \text{heap}[i]$.

---

## 5. Instructions for Adding Algorithm #68 (Recipe)

The architecture is explicitly designed so that adding any new algorithm costs exactly the same as adding the first: **one pure data file, one registry line, zero changes to engines or UI components.**

### Step 1: Create Generator Data File
Create `src/visualizer/algorithms/[category]/[slug].ts`:
```ts
import { AlgoDefinition, ArrayPointersStep } from '../../core/types';

export const myAlgoDef: AlgoDefinition<{ target: number; numbers: number[] }> = {
  id: 'my-algo',
  name: 'My New Algorithm',
  category: 'searching',
  engine: 'array-pointers',
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Clear 2-line description of what this algorithm does and when to use it.',
  pseudocode: [
    'procedure myAlgo(target, arr):',
    '  // step 1...',
  ],
  presets: [
    { name: 'typical', label: 'Typical Case', input: { target: 7, numbers: [1, 3, 5, 7, 9] } },
    { name: 'worst', label: 'Worst Case', input: { target: 99, numbers: [2, 4, 6, 8, 10] } },
    { name: 'edge', label: 'Single Element', input: { target: 5, numbers: [5] } },
  ],
  generate({ target, numbers }) {
    const steps: ArrayPointersStep[] = [];
    // Synchronously push Step snapshots with caption, highlighted pseudocode line, and variables
    steps.push({
      engine: 'array-pointers',
      caption: `Starting algorithm for target ${target}.`,
      line: 0,
      vars: { target },
      array: {
        values: [...numbers],
        pointers: [{ name: 'curr', index: 0 }],
      },
    });
    return steps;
  },
};
export default myAlgoDef;
```

### Step 2: Register in `src/visualizer/registry.ts`
1. Add metadata to `ALGORITHM_REGISTRY`:
```ts
{
  id: 'my-algo',
  name: 'My New Algorithm',
  category: 'searching',
  engine: 'array-pointers',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
  inputKind: 'target-and-numbers',
  blurb: 'Clear 2-line description...',
},
```
2. Add dynamic loader to `ALGO_LOADERS`:
```ts
'my-algo': () => import('./algorithms/searching/my-algo'),
```

### Step 3: Run Validation
Run `npm test`, `npm run typecheck`, and `npm run build`. The build will automatically generate the static route `/visualizer/my-algo/` via `generateStaticParams()`.

---

## 6. Known Limitations & Future Enhancements

1. **Graph Layout Geometry:** The graph engine currently positions nodes in an optimal circular coordinate projection. For massive planar graphs ($V > 25$), implementing a force-directed layout iteration would enhance spacing.
2. **Audio Volume Control:** Currently, audio provides instant toggle (Mute / Sound). Adding an explicit volume slider would offer fine-grained acoustic preference control.
3. **User Code in Visualizer:** While user code execution in Iwons occurs safely in isolated Web Workers for problems, the visualizer uses verified pure generators. Enabling user-authored generators directly in the visualizer could be explored in future releases using existing worker isolation.
