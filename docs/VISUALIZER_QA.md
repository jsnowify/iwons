# Iwons Algorithm Visualizer QA & Verification Plan

Date: 2026-10-17  
Author: Senior QA Engineer  

---

## 1. Top Failure Modes by Engine

### Engine 1: Bars (Sorting)
1. **Empty Array (`[]`) or Single Element (`[42]`):** Generator must emit valid initial/final frame without throwing index out-of-bounds or zero-division on SVG bar width.
2. **All Elements Equal (`[7, 7, 7, 7]`):** Must not loop indefinitely or swap equal elements infinitely (e.g. strict vs non-strict inequality in partition/quicksort).
3. **Negative Numbers & Zero (`[-15, 0, 8, -3]`):** SVG bar height scaling must accommodate negative minimums or offset to positive baseline without drawing inverted bars off-canvas.
4. **Already Sorted & Reverse Sorted:** Worst-case recursion depth in Quicksort must not blow the stack (tail-call optimization or iterative partition).
5. **Auxiliary Array Mismatch (Merge/Counting/Radix):** Secondary buffer must maintain synchronized bounds with primary array.

### Engine 2: Array & Pointers (Search, Windows, Strings)
1. **Target Absent (Smaller than Min, Larger than Max, In-between):** Binary/Jump/Interpolation search must terminate with `result: -1` and empty interval, never hanging in infinite loop.
2. **Duplicate Targets:** Search must find a valid matching index deterministically.
3. **Window Exceeding Array Length:** Fixed-size sliding window with $k > n$ must handle cleanly with clear message.
4. **Empty Needle / Pattern in String Search:** Pattern matching on empty pattern or pattern longer than text must handle gracefully without out-of-bounds substring slicing.
5. **Pointer Crossover:** Two pointers moving inward must stop strictly when `left >= right` without crossing into inverted ranges.

### Engine 3: Grid & Table (DP, Matrices, Backtracking)
1. **Base Case Indexing ($n = 0$):** Falsy zero values in JavaScript (`0 || 7`) must not trigger fallback defaults. Tabulation for $n=0$ must return 0.
2. **Unreachable Targets / Impossible Solutions:** Knapsack with capacity 0, Coin Change with impossible amount (e.g. amount 7 with coin [5, 10]), or unsolvable Sudoku board must report no solution without crashing traceback.
3. **Traceback Infinite Loops:** Path reconstruction at the end of DP must strictly follow predecessor pointers and terminate at base cases.
4. **Matrix Dimensions ($1 \times 1$, $1 \times N$, $N \times 1$):** Spiral traversal and matrix rotations must handle non-square or degenerate 1D matrices without duplicate visits.

### Engine 4: Graph (Traversals, Shortest Paths, MST)
1. **Disconnected Graphs:** BFS/DFS must finish visiting the component containing `startNode` and clearly caption that unreached vertices are disconnected.
2. **Negative Cycles & Negative Edges:** Dijkstra must reject or guard against negative edges; Bellman-Ford must correctly flag negative cycles on the $V$-th iteration.
3. **Self-Loops & Multi-Edges:** Graphs with edges from $A \to A$ or multiple edges between $A$ and $B$ must not duplicate queue entries.
4. **Zero-Degree Isolated Nodes:** Layout engine must position isolated nodes neatly without division by zero in coordinate geometry.

### Engine 5: Tree & Heap
1. **Degenerate Linked Trees (Skewed BST):** Tree layout must adjust bounding box so deep skewed trees do not overlap sibling branches.
2. **Empty Tree / Single Node:** Traversal generators must handle `null` root gracefully.
3. **Heap Bubble-Up / Sift-Down Boundary:** Extracting the last element from a 1-element heap must leave heap empty without index errors.
4. **Duplicate Keys in BST:** Insert policy must be consistent (e.g., duplicates go right or are rejected).

### Engine 6: Nodes & Arrows (Linked Lists, LRU, Hashing)
1. **Cycle in Linked List:** Traversals that don't expect cycles must guard against infinite iteration, while Floyd cycle detector must terminate.
2. **Head/Tail Deletions:** Reversal of 1-node or 2-node lists must update both `head` and pointer links cleanly.
3. **Hash Collisions & Full Table:** Open addressing with 100% load must detect full table and report probe failure; separate chaining must render bucket chains cleanly without arrow overlap.
4. **LRU Cache Capacity Exceeded:** Eviction must correctly drop the least recently used node from both linked list and lookup map.

---

## 2. Player Abuse & Lifecycle Scenarios

| Scenario | Abuse Condition | Expected System Behavior |
| --- | --- | --- |
| **Rapid Play/Pause Spam** | User rapidly toggles Play button 20 times in 1 second | State machine cleanly alternates between `playing` and `paused`; exactly one timer is active, no timer leaks. |
| **Step Back at Frame 0** | User presses Left Arrow or clicks Step Back at the first step | Clamped at frame 0, status remains `paused`, no index underflow. |
| **Step Forward at Last Frame** | User presses Right Arrow or clicks Step Forward at the last step | Clamped at `steps.length - 1`, status is `completed`, no index overflow. |
| **Scrubbing Mid-Playback** | User drags timeline slider while autoplay is running | State jumps immediately to target frame, status switches to `paused`, no audio clicks or jitter. |
| **Speed Change Mid-Playback** | User selects 4x speed while playing | Autoplay picks up new delay on next tick without restarting from frame 0. |
| **Switch Algorithm Mid-Playback** | User switches from Bubble Sort to Dijkstra while playing | Active playback timer cancelled, audio context muted, player resets cleanly to frame 0 of new algorithm. |
| **Component Unmount During Play** | User navigates to `/problems` while visualizer is playing | `useEffect` cleanup hook cancels active timer, closes Web Audio context, zero console memory warnings. |

---

## 3. Bug Regression Log

| ID | Issue Description | How Discovered | Root Cause | Fix Applied | Test Case |
| --- | --- | --- | --- | --- | --- |
| **BUG-001** | Fibonacci DP generator returned F(7) when input was 0 | Unit test with $n=0$ | Logical OR fallback `Number(rawN) \|\| 7` treated falsy `0` as absent | Replaced with `Number.isFinite(Number(rawN)) ? Number(rawN) : 7` | `Engine 3: Fibonacci DP produces correct tabulated values` |

---

## 4. Oracle Verification Strategy

Every algorithm in the Iwons library must be verified against an independent oracle:
- **Sorting Algorithms:** Compare output against JavaScript native `[...input].sort((a, b) => a - b)` across 200 random seeded arrays and all edge cases.
- **Search Algorithms:** Compare result against native `Array.prototype.indexOf()` or binary search oracle.
- **Shortest Paths:** Compare Dijkstra and Bellman-Ford distances against all-pairs Floyd-Warshall or BFS on unweighted edges.
- **Dynamic Programming:** Compare tabulated answers against pure recursive memoized oracles.
- **Tree Traversals:** Compare BST inorder traversal against a sorted set of input elements.
