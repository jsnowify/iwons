/**
 * Iwons Algorithm Visualizer - Algorithm Registry
 *
 * Lightweight metadata registry for 200+ algorithms.
 * Generators and pseudocode are loaded dynamically via dynamic import()
 * so the initial bundle stays tiny.
 */

import {
  AlgoMetadata,
  AlgoDefinition,
  AlgorithmCategory,
  EngineType,
} from "./core/types";

export const ALGORITHM_REGISTRY: AlgoMetadata[] = [
  // --- ENGINE 1: BARS (SORTING) ---
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
  },
  {
    id: "selection-sort",
    name: "Selection Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Repeatedly finds the minimum element from the unsorted suffix and puts it at the beginning.",
  },
  {
    id: "insertion-sort",
    name: "Insertion Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Builds the final sorted array one item at a time by repeatedly inserting elements into a sorted prefix.",
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      space: "O(n)",
    },
    inputKind: "numbers",
    blurb:
      "Divide-and-conquer algorithm that divides the array in half, sorts both halves, and merges them back together.",
  },
  {
    id: "quick-sort",
    name: "Quicksort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n²)",
      space: "O(log n)",
    },
    inputKind: "numbers",
    blurb:
      "Selects a pivot element and partitions the array into values smaller and larger than the pivot.",
  },
  {
    id: "heap-sort",
    name: "Heap Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Converts the array into a max-heap, then repeatedly extracts the maximum element to the end of the array.",
  },
  {
    id: "counting-sort",
    name: "Counting Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n + k)",
      average: "O(n + k)",
      worst: "O(n + k)",
      space: "O(k)",
    },
    inputKind: "numbers",
    blurb:
      "Non-comparison integer sorting algorithm that tallies the frequency of each distinct key.",
  },
  {
    id: "radix-sort",
    name: "Radix Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(d · (n + b))",
      average: "O(d · (n + b))",
      worst: "O(d · (n + b))",
      space: "O(n + b)",
    },
    inputKind: "numbers",
    blurb:
      "Sorts keys digit by digit starting from least significant digit using a stable subroutine like counting sort.",
  },
  {
    id: "bucket-sort",
    name: "Bucket Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n + k)",
      average: "O(n + k)",
      worst: "O(n²)",
      space: "O(n + k)",
    },
    inputKind: "numbers",
    blurb:
      "Distributes elements into several buckets, sorts each bucket individually, and concatenates them.",
  },
  {
    id: "shell-sort",
    name: "Shell Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n log n)",
      average: "O(n^(4/3))",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Generalization of insertion sort that allows exchanges of far-apart elements using diminishing gap sequences.",
  },
  {
    id: "cocktail-shaker-sort",
    name: "Cocktail Shaker Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Bidirectional variation of bubble sort that traverses back and forth to address turtle elements.",
  },
  {
    id: "comb-sort",
    name: "Comb Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n log n)",
      average: "O(n² / 2^p)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Improves bubble sort by eliminating small values near the end using a shrinking comparison gap with factor 1.3.",
  },
  {
    id: "gnome-sort",
    name: "Gnome Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Sorts by stepping backward when an inversion is detected and forward when elements are in order.",
  },
  {
    id: "tim-sort",
    name: "Tim Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      space: "O(n)",
    },
    inputKind: "numbers",
    blurb:
      "Hybrid stable sorting algorithm derived from merge sort and insertion sort, optimized for real-world data.",
  },
  {
    id: "cycle-sort",
    name: "Cycle Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "In-place unstable sorting algorithm that minimizes the total number of memory writes.",
  },
  {
    id: "pancake-sort",
    name: "Pancake Sort",
    category: "sorting",
    engine: "bars",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    inputKind: "numbers",
    blurb:
      "Sorts an array using only prefix-reversal operations (flipping the top k elements).",
  },

  // --- ENGINE 2: ARRAY & POINTERS (SEARCHING, ARRAYS, STRINGS) ---
  {
    id: "linear-search",
    name: "Linear Search",
    category: "searching",
    engine: "array-pointers",
    complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "target-and-numbers",
    blurb:
      "Sequentially checks each element of the list until a match is found or the whole list has been searched.",
  },
  {
    id: "binary-search",
    name: "Binary Search",
    category: "searching",
    engine: "array-pointers",
    complexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Finds the position of a target value within a sorted array by repeatedly dividing the search interval in half.",
  },
  {
    id: "jump-search",
    name: "Jump Search",
    category: "searching",
    engine: "array-pointers",
    complexity: {
      best: "O(1)",
      average: "O(√n)",
      worst: "O(√n)",
      space: "O(1)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Searches sorted arrays by jumping ahead by fixed blocks of √n, then performing linear search.",
  },
  {
    id: "interpolation-search",
    name: "Interpolation Search",
    category: "searching",
    engine: "array-pointers",
    complexity: {
      best: "O(1)",
      average: "O(log log n)",
      worst: "O(n)",
      space: "O(1)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Estimates target position in uniformly distributed sorted data using linear interpolation formula.",
  },
  {
    id: "exponential-search",
    name: "Exponential Search",
    category: "searching",
    engine: "array-pointers",
    complexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Finds range where element resides by doubling powers of 2, then performs binary search in that bounded range.",
  },
  {
    id: "ternary-search",
    name: "Ternary Search",
    category: "searching",
    engine: "array-pointers",
    complexity: {
      best: "O(1)",
      average: "O(log₃ n)",
      worst: "O(log₃ n)",
      space: "O(1)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Divides sorted range into three equal parts to determine which third contains the target.",
  },
  {
    id: "two-pointers-pair-sum",
    name: "Two Pointers (Pair Sum)",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "target-and-numbers",
    blurb:
      "Maintains low and high pointers moving inward to find pairs summing to a target in sorted arrays.",
  },
  {
    id: "fast-and-slow-pointers",
    name: "Fast and Slow Pointers (Floyd)",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Moves two pointers at different speeds (tortoise and hare) to detect cycles or find middle elements.",
  },
  {
    id: "sliding-window-fixed",
    name: "Sliding Window (Fixed Size)",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "target-and-numbers",
    blurb:
      "Maintains a running sum or metric across a window of fixed length k as it slides across an array.",
  },
  {
    id: "sliding-window-variable",
    name: "Sliding Window (Variable Size)",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "target-and-numbers",
    blurb:
      "Dynamically expands right edge to satisfy constraints and contracts left edge to find optimal subarrays.",
  },
  {
    id: "prefix-sum",
    name: "Prefix Sum Array",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
    inputKind: "numbers",
    blurb:
      "Precomputes cumulative running sums to answer range sum queries in constant O(1) time.",
  },
  {
    id: "kadanes-algorithm",
    name: "Kadane's Algorithm",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Finds the contiguous subarray with maximum sum in linear time by maintaining a current sum and global max.",
  },
  {
    id: "dutch-national-flag",
    name: "Dutch National Flag (3-way Partition)",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Sorts an array of three distinct values (such as 0s, 1s, and 2s) in a single pass with low, mid, and high pointers.",
  },
  {
    id: "boyer-moore-voting",
    name: "Boyer-Moore Majority Vote",
    category: "arrays",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Identifies the candidate element that appears strictly more than n/2 times in O(1) space.",
  },
  {
    id: "kmp-string-match",
    name: "Knuth-Morris-Pratt (KMP)",
    category: "strings",
    engine: "array-pointers",
    complexity: {
      best: "O(n)",
      average: "O(n + m)",
      worst: "O(n + m)",
      space: "O(m)",
    },
    inputKind: "pattern-match",
    blurb:
      "Uses a precomputed failure function (pi table) to avoid re-examining characters that already matched.",
  },
  {
    id: "rabin-karp",
    name: "Rabin-Karp String Match",
    category: "strings",
    engine: "array-pointers",
    complexity: {
      best: "O(n + m)",
      average: "O(n + m)",
      worst: "O(n · m)",
      space: "O(1)",
    },
    inputKind: "pattern-match",
    blurb:
      "Uses rolling hashes to quickly filter out positions that cannot match the search pattern.",
  },
  {
    id: "z-algorithm",
    name: "Z-Algorithm",
    category: "strings",
    engine: "array-pointers",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
    inputKind: "pattern-match",
    blurb:
      "Computes longest prefix match lengths (Z-array) for all suffixes of a concatenated pattern string.",
  },

  // --- ENGINE 3: GRID & TABLE (DP, MATRICES, BACKTRACKING) ---
  {
    id: "fibonacci-dp",
    name: "Fibonacci (Memoization vs Tabulation)",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
    inputKind: "numbers",
    blurb:
      "Demonstrates overlapping subproblems and shows how tabulation fills values sequentially from base cases.",
  },
  {
    id: "knapsack-0-1",
    name: "0/1 Knapsack Problem",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: {
      best: "O(n · W)",
      average: "O(n · W)",
      worst: "O(n · W)",
      space: "O(n · W)",
    },
    inputKind: "numbers",
    blurb:
      "Fills a 2D table to determine maximum value obtainable without exceeding weight capacity W, tracing back choices.",
  },
  {
    id: "longest-common-subsequence",
    name: "Longest Common Subsequence (LCS)",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: {
      best: "O(n · m)",
      average: "O(n · m)",
      worst: "O(n · m)",
      space: "O(n · m)",
    },
    inputKind: "pattern-match",
    blurb:
      "Constructs 2D DP table comparing string prefixes and traces back diagonal and adjacent transitions.",
  },
  {
    id: "edit-distance",
    name: "Edit Distance (Levenshtein)",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: {
      best: "O(n · m)",
      average: "O(n · m)",
      worst: "O(n · m)",
      space: "O(n · m)",
    },
    inputKind: "pattern-match",
    blurb:
      "Computes minimum insertions, deletions, and substitutions needed to transform word1 into word2.",
  },
  {
    id: "coin-change-min",
    name: "Coin Change (Minimum Coins)",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: {
      best: "O(n · amount)",
      average: "O(n · amount)",
      worst: "O(n · amount)",
      space: "O(amount)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Builds optimal minimum coin counts for every intermediate sub-amount up to the target amount.",
  },
  {
    id: "grid-unique-paths",
    name: "Unique Paths in Grid",
    category: "dynamic-programming",
    engine: "grid-table",
    complexity: {
      best: "O(m · n)",
      average: "O(m · n)",
      worst: "O(m · n)",
      space: "O(m · n)",
    },
    inputKind: "grid",
    blurb:
      "Calculates the number of paths from top-left to bottom-right moving only right and down.",
  },
  {
    id: "matrix-spiral-traversal",
    name: "Matrix Spiral Traversal",
    category: "matrices",
    engine: "grid-table",
    complexity: {
      best: "O(m · n)",
      average: "O(m · n)",
      worst: "O(m · n)",
      space: "O(1)",
    },
    inputKind: "grid",
    blurb:
      "Traverses a 2D matrix in spiral order using top, bottom, left, and right boundary pointers.",
  },
  {
    id: "n-queens",
    name: "N-Queens Backtracking",
    category: "backtracking",
    engine: "grid-table",
    complexity: {
      best: "O(N!)",
      average: "O(N!)",
      worst: "O(N!)",
      space: "O(N)",
    },
    inputKind: "numbers",
    blurb:
      "Places N non-attacking queens on an N×N board using depth-first backtracking and conflict checking.",
  },
  {
    id: "sudoku-solver",
    name: "Sudoku Solver",
    category: "backtracking",
    engine: "grid-table",
    complexity: {
      best: "O(9^(m))",
      average: "O(9^(m))",
      worst: "O(9^(m))",
      space: "O(81)",
    },
    inputKind: "grid",
    blurb:
      "Fills 9×9 puzzle cells using recursive backtracking, checking row, column, and 3×3 subgrid constraints.",
  },

  // --- ENGINE 4: GRAPH (TRAVERSALS, SHORTEST PATHS, MST) ---
  {
    id: "bfs-graph",
    name: "Breadth-First Search (BFS)",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Explores graph vertices layer by layer using a FIFO queue, finding unweighted shortest paths.",
  },
  {
    id: "dfs-graph",
    name: "Depth-First Search (DFS)",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Traverses deep along each branch as far as possible before backtracking using a LIFO stack.",
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Shortest Path",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O((V + E) log V)",
      average: "O((V + E) log V)",
      worst: "O((V + E) log V)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Finds single-source shortest paths on weighted non-negative graphs using a priority queue greedy strategy.",
  },
  {
    id: "bellman-ford",
    name: "Bellman-Ford Algorithm",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O(E)",
      average: "O(V · E)",
      worst: "O(V · E)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Relaxes all edges V-1 times, computing shortest paths and detecting reachable negative weight cycles.",
  },
  {
    id: "kruskal-mst",
    name: "Kruskal's Minimum Spanning Tree",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O(E log E)",
      average: "O(E log E)",
      worst: "O(E log E)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Greedily adds lowest-weight edges that do not form a cycle, using Disjoint-Set Union (Union-Find).",
  },
  {
    id: "prim-mst",
    name: "Prim's Minimum Spanning Tree",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O((V + E) log V)",
      average: "O((V + E) log V)",
      worst: "O((V + E) log V)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Grows an MST from a starting node by continually adding the cheapest edge connecting the tree to unvisited nodes.",
  },
  {
    id: "topological-sort-kahns",
    name: "Topological Sort (Kahn's)",
    category: "graphs",
    engine: "graph",
    complexity: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
    },
    inputKind: "graph",
    blurb:
      "Orders vertices of a DAG linearly using in-degrees and a queue of zero-indegree candidate nodes.",
  },

  // --- ENGINE 5: TREE & HEAP ---
  {
    id: "binary-tree-inorder",
    name: "Binary Tree Inorder Traversal",
    category: "trees",
    engine: "tree-heap",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(h)" },
    inputKind: "tree",
    blurb:
      "Visits left subtree, root, then right subtree; yields keys in non-decreasing order for BSTs.",
  },
  {
    id: "binary-tree-preorder",
    name: "Binary Tree Preorder Traversal",
    category: "trees",
    engine: "tree-heap",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(h)" },
    inputKind: "tree",
    blurb:
      "Visits root, left subtree, then right subtree; widely used for cloning and serializing trees.",
  },
  {
    id: "binary-tree-postorder",
    name: "Binary Tree Postorder Traversal",
    category: "trees",
    engine: "tree-heap",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(h)" },
    inputKind: "tree",
    blurb:
      "Visits left subtree, right subtree, then root; ideal for bottom-up deletions and subtree metrics.",
  },
  {
    id: "binary-tree-level-order",
    name: "Binary Tree Level-Order (BFS)",
    category: "trees",
    engine: "tree-heap",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(w)" },
    inputKind: "tree",
    blurb:
      "Explores tree level by level from top to bottom, left to right, using an explicit FIFO queue.",
  },
  {
    id: "bst-search-insert",
    name: "BST Search & Insertion",
    category: "trees",
    engine: "tree-heap",
    complexity: {
      best: "O(log n)",
      average: "O(log n)",
      worst: "O(n)",
      space: "O(h)",
    },
    inputKind: "target-and-numbers",
    blurb:
      "Navigates left if key < node and right if key > node, finding position and grafting new leaf.",
  },
  {
    id: "avl-tree-rotations",
    name: "AVL Tree Self-Balancing",
    category: "trees",
    engine: "tree-heap",
    complexity: {
      best: "O(log n)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(log n)",
    },
    inputKind: "numbers",
    blurb:
      "Maintains height balance factor within {-1, 0, 1} through LL, RR, LR, and RL rotations.",
  },
  {
    id: "binary-heap-operations",
    name: "Binary Heap Operations",
    category: "heaps",
    engine: "tree-heap",
    complexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(n)",
    },
    inputKind: "numbers",
    blurb:
      "Visualizes swim (bubble-up) and sink (sift-down) operations with synchronized tree and array representations.",
  },

  // --- ENGINE 6: NODES & ARROWS (LINKED LISTS, STACK, QUEUE, HASHING) ---
  {
    id: "reverse-linked-list",
    name: "Reverse Linked List",
    category: "linked-lists",
    engine: "nodes-arrows",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Reverses singly linked list pointers in-place using prev, curr, and next tracking pointers.",
  },
  {
    id: "linked-list-cycle-detection",
    name: "Linked List Cycle Detection",
    category: "linked-lists",
    engine: "nodes-arrows",
    complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    inputKind: "numbers",
    blurb:
      "Uses slow and fast pointers to detect whether a linked list contains a cycle without extra storage.",
  },
  {
    id: "stack-operations",
    name: "Stack Push & Pop",
    category: "stacks-queues",
    engine: "nodes-arrows",
    complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(n)" },
    inputKind: "numbers",
    blurb:
      "Last-In-First-Out data structure where elements are pushed and popped exclusively from the top.",
  },
  {
    id: "queue-operations",
    name: "Queue Enqueue & Dequeue",
    category: "stacks-queues",
    engine: "nodes-arrows",
    complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(n)" },
    inputKind: "numbers",
    blurb:
      "First-In-First-Out data structure where elements join at the rear and exit from the front.",
  },
  {
    id: "hash-table-chaining",
    name: "Hash Table (Separate Chaining)",
    category: "hashing",
    engine: "nodes-arrows",
    complexity: { best: "O(1)", average: "O(1)", worst: "O(n)", space: "O(n)" },
    inputKind: "numbers",
    blurb:
      "Resolves hash key collisions by storing conflicting elements in linked lists at each bucket index.",
  },
  {
    id: "lru-cache",
    name: "LRU Cache (Doubly Linked + Map)",
    category: "hashing",
    engine: "nodes-arrows",
    complexity: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(capacity)",
    },
    inputKind: "numbers",
    blurb:
      "Evicts least recently accessed items in O(1) time by coordinating a hash map and a doubly linked list.",
  },
];

export const CATEGORIES_LIST: { id: AlgorithmCategory; label: string }[] = [
  { id: "sorting", label: "Sorting" },
  { id: "searching", label: "Searching" },
  { id: "arrays", label: "Arrays & Pointers" },
  { id: "strings", label: "Strings" },
  { id: "dynamic-programming", label: "Dynamic Programming" },
  { id: "matrices", label: "Matrices" },
  { id: "backtracking", label: "Backtracking" },
  { id: "graphs", label: "Graphs" },
  { id: "trees", label: "Trees" },
  { id: "heaps", label: "Heaps" },
  { id: "linked-lists", label: "Linked Lists" },
  { id: "stacks-queues", label: "Stacks & Queues" },
  { id: "hashing", label: "Hashing" },
  { id: "greedy", label: "Greedy" },
  { id: "divide-and-conquer", label: "Divide & Conquer" },
  { id: "math", label: "Math" },
  { id: "bit-manipulation", label: "Bit Tricks" },
  { id: "geometry", label: "Geometry" },
];

export const ENGINES_LIST: { id: EngineType; label: string }[] = [
  { id: "bars", label: "Bars (Sorting)" },
  { id: "array-pointers", label: "Array & Pointers" },
  { id: "grid-table", label: "Grid & Table" },
  { id: "graph", label: "Graph" },
  { id: "tree-heap", label: "Tree & Heap" },
  { id: "nodes-arrows", label: "Nodes & Arrows" },
];

export function getAlgorithmMetadata(id: string): AlgoMetadata | undefined {
  return ALGORITHM_REGISTRY.find((item) => item.id === id);
}

export function getAlgorithmsByCategory(
  category: AlgorithmCategory,
): AlgoMetadata[] {
  return ALGORITHM_REGISTRY.filter((item) => item.category === category);
}

export function getAlgorithmsByEngine(engine: EngineType): AlgoMetadata[] {
  return ALGORITHM_REGISTRY.filter((item) => item.engine === engine);
}

/**
 * Dynamic loader table: maps algorithm IDs to their lazy module loaders.
 * Only contains implemented modules so compiler passes cleanly;
 * additional algorithms are wired as their engines are built.
 */
export const ALGO_LOADERS: Record<
  string,
  () => Promise<{ default: AlgoDefinition<any> }>
> = {
  // Engine 1: Bars (Sorting - 16 Algorithms)
  "bubble-sort": () => import("./algorithms/sorting/bubble-sort"),
  "selection-sort": () => import("./algorithms/sorting/selection-sort"),
  "insertion-sort": () => import("./algorithms/sorting/insertion-sort"),
  "merge-sort": () => import("./algorithms/sorting/merge-sort"),
  "quick-sort": () => import("./algorithms/sorting/quick-sort"),
  "heap-sort": () => import("./algorithms/sorting/heap-sort"),
  "counting-sort": () => import("./algorithms/sorting/counting-sort"),
  "radix-sort": () => import("./algorithms/sorting/radix-sort"),
  "bucket-sort": () => import("./algorithms/sorting/bucket-sort"),
  "shell-sort": () => import("./algorithms/sorting/shell-sort"),
  "cocktail-shaker-sort": () =>
    import("./algorithms/sorting/cocktail-shaker-sort"),
  "comb-sort": () => import("./algorithms/sorting/comb-sort"),
  "gnome-sort": () => import("./algorithms/sorting/gnome-sort"),
  "tim-sort": () => import("./algorithms/sorting/tim-sort"),
  "cycle-sort": () => import("./algorithms/sorting/cycle-sort"),
  "pancake-sort": () => import("./algorithms/sorting/pancake-sort"),

  // Engine 2: Array & Pointers (17 Algorithms - Searching, Arrays, Strings)
  "linear-search": () => import("./algorithms/searching/linear-search"),
  "binary-search": () => import("./algorithms/searching/binary-search"),
  "jump-search": () => import("./algorithms/searching/jump-search"),
  "interpolation-search": () =>
    import("./algorithms/searching/interpolation-search"),
  "exponential-search": () =>
    import("./algorithms/searching/exponential-search"),
  "ternary-search": () => import("./algorithms/searching/ternary-search"),
  "two-pointers-pair-sum": () =>
    import("./algorithms/arrays/two-pointers-pair-sum"),
  "fast-and-slow-pointers": () =>
    import("./algorithms/arrays/fast-and-slow-pointers"),
  "sliding-window-fixed": () =>
    import("./algorithms/arrays/sliding-window-fixed"),
  "sliding-window-variable": () =>
    import("./algorithms/arrays/sliding-window-variable"),
  "prefix-sum": () => import("./algorithms/arrays/prefix-sum"),
  "kadanes-algorithm": () => import("./algorithms/arrays/kadanes-algorithm"),
  "dutch-national-flag": () =>
    import("./algorithms/arrays/dutch-national-flag"),
  "boyer-moore-voting": () => import("./algorithms/arrays/boyer-moore-voting"),
  "kmp-string-match": () => import("./algorithms/strings/kmp-string-match"),
  "rabin-karp": () => import("./algorithms/strings/rabin-karp"),
  "z-algorithm": () => import("./algorithms/strings/z-algorithm"),

  // Engine 3: Grid & Table (9 Algorithms - DP, Matrices, Backtracking)
  "fibonacci-dp": () => import("./algorithms/dp/fibonacci-dp"),
  "knapsack-0-1": () => import("./algorithms/dp/knapsack-0-1"),
  "longest-common-subsequence": () =>
    import("./algorithms/dp/longest-common-subsequence"),
  "edit-distance": () => import("./algorithms/dp/edit-distance"),
  "coin-change-min": () => import("./algorithms/dp/coin-change-min"),
  "grid-unique-paths": () => import("./algorithms/dp/grid-unique-paths"),
  "matrix-spiral-traversal": () =>
    import("./algorithms/matrices/matrix-spiral-traversal"),
  "n-queens": () => import("./algorithms/backtracking/n-queens"),
  "sudoku-solver": () => import("./algorithms/backtracking/sudoku-solver"),

  // Engine 4: Graph (7 Algorithms - BFS, DFS, Shortest Paths, MST, TopoSort)
  "bfs-graph": () => import("./algorithms/graphs/bfs-graph"),
  "dfs-graph": () => import("./algorithms/graphs/dfs-graph"),
  dijkstra: () => import("./algorithms/graphs/dijkstra"),
  "bellman-ford": () => import("./algorithms/graphs/bellman-ford"),
  "kruskal-mst": () => import("./algorithms/graphs/kruskal-mst"),
  "prim-mst": () => import("./algorithms/graphs/prim-mst"),
  "topological-sort-kahns": () =>
    import("./algorithms/graphs/topological-sort-kahns"),

  // Engine 5: Tree & Heap
  "binary-tree-inorder": () => import("./algorithms/trees/binary-tree-inorder"),
  "binary-tree-preorder": () => import("./algorithms/trees/binary-tree-preorder"),
  "binary-tree-postorder": () => import("./algorithms/trees/binary-tree-postorder"),
  "binary-tree-level-order": () => import("./algorithms/trees/binary-tree-level-order"),
  "bst-search-insert": () => import("./algorithms/trees/bst-search-insert"),
  "avl-tree-rotations": () => import("./algorithms/trees/avl-tree-rotations"),
  "binary-heap-operations": () => import("./algorithms/heaps/binary-heap-operations"),

  // Engine 6: Nodes & Arrows
  "reverse-linked-list": () =>
    import("./algorithms/linked-lists/reverse-linked-list"),
  "linked-list-cycle-detection": () =>
    import("./algorithms/linked-lists/linked-list-cycle-detection"),
  "stack-operations": () =>
    import("./algorithms/stacks-queues/stack-operations"),
  "queue-operations": () =>
    import("./algorithms/stacks-queues/queue-operations"),
  "hash-table-chaining": () =>
    import("./algorithms/hashing/hash-table-chaining"),
  "lru-cache": () => import("./algorithms/hashing/lru-cache"),
};

/**
 * Safely loads an algorithm definition by ID.
 * Returns null if not found or if the loader fails.
 */
export async function loadAlgorithmDefinition(
  id: string,
): Promise<AlgoDefinition<any> | null> {
  const loader = ALGO_LOADERS[id];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default || (mod as unknown as AlgoDefinition<any>);
  } catch (err) {
    console.warn(
      `[Visualizer Registry] Failed to load algorithm "${id}":`,
      err,
    );
    return null;
  }
}
