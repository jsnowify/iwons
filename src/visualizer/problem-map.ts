/**
 * Iwons Algorithm Visualizer - Problem to Visualizer Mapping
 *
 * Tastefully maps curriculum problem patterns, topics, or units to
 * corresponding algorithm visualizer interactive pages.
 */

export interface VisualizerLink {
  slug: string;
  name: string;
}

const PATTERN_MAPPINGS: Array<{ match: RegExp; slug: string; name: string }> = [
  { match: /binary[\s-]?search/i, slug: 'binary-search', name: 'Binary Search' },
  { match: /two[\s-]?pointers?/i, slug: 'two-pointers-pair-sum', name: 'Two Pointers' },
  { match: /fast[\s-]?and[\s-]?slow|tortoise|floyd/i, slug: 'fast-and-slow-pointers', name: 'Fast & Slow Pointers' },
  { match: /sliding[\s-]?window/i, slug: 'sliding-window-variable', name: 'Sliding Window' },
  { match: /prefix[\s-]?sum/i, slug: 'prefix-sum', name: 'Prefix Sum' },
  { match: /kadane|maximum[\s-]?subarray/i, slug: 'kadanes-algorithm', name: "Kadane's Algorithm" },
  { match: /dutch[\s-]?national|three[\s-]?way/i, slug: 'dutch-national-flag', name: 'Dutch National Flag' },
  { match: /majority[\s-]?element|boyer[\s-]?moore/i, slug: 'boyer-moore-voting', name: 'Boyer-Moore Voting' },
  { match: /kmp|knuth[\s-]?morris/i, slug: 'kmp-string-match', name: 'Knuth-Morris-Pratt (KMP)' },
  { match: /rabin[\s-]?karp/i, slug: 'rabin-karp', name: 'Rabin-Karp' },
  { match: /dijkstra/i, slug: 'dijkstra', name: "Dijkstra's Algorithm" },
  { match: /bellman[\s-]?ford/i, slug: 'bellman-ford', name: 'Bellman-Ford' },
  { match: /kruskal/i, slug: 'kruskal-mst', name: "Kruskal's MST" },
  { match: /prim['’]?s/i, slug: 'prim-mst', name: "Prim's MST" },
  { match: /topological[\s-]?sort|kahn/i, slug: 'topological-sort-kahns', name: "Topological Sort (Kahn's)" },
  { match: /breadth[\s-]?first|bfs/i, slug: 'bfs-graph', name: 'Breadth-First Search (BFS)' },
  { match: /depth[\s-]?first|dfs/i, slug: 'dfs-graph', name: 'Depth-First Search (DFS)' },
  { match: /avl[\s-]?tree|tree[\s-]?rotation/i, slug: 'avl-tree-rotations', name: 'AVL Tree Self-Balancing' },
  { match: /binary[\s-]?search[\s-]?tree|bst/i, slug: 'bst-search-insert', name: 'BST Search & Insert' },
  { match: /heap|priority[\s-]?queue/i, slug: 'binary-heap-operations', name: 'Binary Heap Operations' },
  { match: /binary[\s-]?tree/i, slug: 'binary-tree-inorder', name: 'Tree Inorder Traversal' },
  { match: /reverse[\s-]?linked[\s-]?list/i, slug: 'reverse-linked-list', name: 'Reverse Linked List' },
  { match: /linked[\s-]?list.*cycle|cycle.*linked[\s-]?list/i, slug: 'linked-list-cycle-detection', name: 'Linked List Cycle Detection' },
  { match: /linked[\s-]?list/i, slug: 'reverse-linked-list', name: 'Linked List Operations' },
  { match: /stack/i, slug: 'stack-operations', name: 'Stack Operations' },
  { match: /queue/i, slug: 'queue-operations', name: 'Queue Operations' },
  { match: /lru[\s-]?cache/i, slug: 'lru-cache', name: 'LRU Cache' },
  { match: /hash[\s-]?table|hash[\s-]?map|separate[\s-]?chaining/i, slug: 'hash-table-chaining', name: 'Hash Table Chaining' },
  { match: /knapsack/i, slug: 'knapsack-0-1', name: '0/1 Knapsack' },
  { match: /longest[\s-]?common[\s-]?subsequence|lcs/i, slug: 'longest-common-subsequence', name: 'Longest Common Subsequence' },
  { match: /edit[\s-]?distance|levenshtein/i, slug: 'edit-distance', name: 'Edit Distance' },
  { match: /coin[\s-]?change/i, slug: 'coin-change-min', name: 'Coin Change' },
  { match: /n[\s-]?queens/i, slug: 'n-queens', name: 'N-Queens Backtracking' },
  { match: /sudoku/i, slug: 'sudoku-solver', name: 'Sudoku Solver' },
  { match: /activity[\s-]?selection/i, slug: 'greedy-activity-selection', name: 'Activity Selection' },
  { match: /sieve|eratosthenes|prime/i, slug: 'sieve-of-eratosthenes', name: 'Sieve of Eratosthenes' },
  { match: /gcd|euclidean/i, slug: 'euclidean-gcd', name: 'Euclidean GCD' },
  { match: /bit[\s-]?count|kernighan/i, slug: 'brian-kernighan-bit-count', name: "Brian Kernighan's Bit Count" },
  { match: /quick[\s-]?sort/i, slug: 'quick-sort', name: 'Quicksort' },
  { match: /merge[\s-]?sort/i, slug: 'merge-sort', name: 'Merge Sort' },
  { match: /insertion[\s-]?sort/i, slug: 'insertion-sort', name: 'Insertion Sort' },
  { match: /bubble[\s-]?sort/i, slug: 'bubble-sort', name: 'Bubble Sort' },
  { match: /sort/i, slug: 'quick-sort', name: 'Sorting' },
];

export function getVisualizerForProblem(problem: {
  slug?: string;
  title?: string;
  topics?: string[];
  patterns?: string[];
  unit?: string;
}): VisualizerLink | null {
  const candidates = [
    ...(problem.patterns || []),
    ...(problem.topics || []),
    problem.unit || '',
    problem.title || '',
    problem.slug || '',
  ];

  for (const mapping of PATTERN_MAPPINGS) {
    for (const text of candidates) {
      if (text && mapping.match.test(text)) {
        return { slug: mapping.slug, name: mapping.name };
      }
    }
  }

  return null;
}

