import { describe, it, expect } from 'vitest';
import binaryTreeInorderDefinition from '../visualizer/algorithms/trees/binary-tree-inorder';
import binaryTreePreorderDefinition from '../visualizer/algorithms/trees/binary-tree-preorder';
import binaryTreePostorderDefinition from '../visualizer/algorithms/trees/binary-tree-postorder';
import binaryTreeLevelOrderDefinition from '../visualizer/algorithms/trees/binary-tree-level-order';
import bstSearchInsertDefinition from '../visualizer/algorithms/trees/bst-search-insert';
import avlTreeRotationsDefinition from '../visualizer/algorithms/trees/avl-tree-rotations';
import binaryHeapOperationsDefinition from '../visualizer/algorithms/heaps/binary-heap-operations';
import { loadAlgorithmDefinition } from '../visualizer/registry';
import { TreeHeapStep, TreeNode, HeapCell } from '../visualizer/core/types';

// Independent Reference Oracle for Binary Search Tree Traversals
interface OracleNode {
  val: number;
  left: OracleNode | null;
  right: OracleNode | null;
}

function oracleInsertBst(root: OracleNode | null, val: number): OracleNode {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) root.left = oracleInsertBst(root.left, val);
  else root.right = oracleInsertBst(root.right, val);
  return root;
}

function oracleBuildBst(values: number[]): OracleNode | null {
  let root: OracleNode | null = null;
  for (const v of values) root = oracleInsertBst(root, v);
  return root;
}

function oracleInorder(root: OracleNode | null): number[] {
  if (!root) return [];
  return [...oracleInorder(root.left), root.val, ...oracleInorder(root.right)];
}

function oraclePreorder(root: OracleNode | null): number[] {
  if (!root) return [];
  return [root.val, ...oraclePreorder(root.left), ...oraclePreorder(root.right)];
}

function oraclePostorder(root: OracleNode | null): number[] {
  if (!root) return [];
  return [...oraclePostorder(root.left), ...oraclePostorder(root.right), root.val];
}

function oracleLevelOrder(root: OracleNode | null): number[] {
  if (!root) return [];
  const result: number[] = [];
  const q: OracleNode[] = [root];
  while (q.length > 0) {
    const node = q.shift()!;
    result.push(node.val);
    if (node.left) q.push(node.left);
    if (node.right) q.push(node.right);
  }
  return result;
}

describe('Engine 5: Tree & Heap Algorithms', () => {
  describe('Registry Dynamic Import Integration', () => {
    it('successfully loads all 7 Tree & Heap algorithm definitions via registry', async () => {
      const ids = [
        'binary-tree-inorder',
        'binary-tree-preorder',
        'binary-tree-postorder',
        'binary-tree-level-order',
        'bst-search-insert',
        'avl-tree-rotations',
        'binary-heap-operations',
      ];

      for (const id of ids) {
        const def = await loadAlgorithmDefinition(id);
        expect(def, `Algorithm ${id} should load successfully`).not.toBeNull();
        expect(def?.id).toBe(id);
        expect(def?.engine).toBe('tree-heap');
        expect(typeof def?.generate).toBe('function');
      }
    });
  });

  describe('Algorithm 1: Binary Tree Inorder Traversal', () => {
    it('matches independent oracle traversal on balanced BST', () => {
      const input = [4, 2, 6, 1, 3, 5, 7];
      const steps = binaryTreeInorderDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(5);

      const finalStep = steps[steps.length - 1];
      const oracleRoot = oracleBuildBst(input);
      const expected = oracleInorder(oracleRoot);

      // Inorder on BST must equal sorted array
      expect(expected).toEqual([1, 2, 3, 4, 5, 6, 7]);
      const lastOutput = finalStep.vars?.output;
      expect(lastOutput).toBe(expected.join(', '));
    });

    it('handles single node input', () => {
      const steps = binaryTreeInorderDefinition.generate([99]) as TreeHeapStep[];
      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.output).toBe('99');
    });
  });

  describe('Algorithm 2: Binary Tree Preorder Traversal', () => {
    it('matches independent oracle preorder traversal on multi-level tree', () => {
      const input = [4, 2, 6, 1, 3, 5, 7];
      const steps = binaryTreePreorderDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(5);

      const finalStep = steps[steps.length - 1];
      const oracleRoot = oracleBuildBst(input);
      const expected = oraclePreorder(oracleRoot);

      expect(expected).toEqual([4, 2, 1, 3, 6, 5, 7]);
      expect(finalStep.vars?.output).toBe(expected.join(', '));
    });

    it('handles right-skewed tree', () => {
      const input = [1, 2, 3, 4, 5];
      const steps = binaryTreePreorderDefinition.generate(input) as TreeHeapStep[];
      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.output).toBe('1, 2, 3, 4, 5');
    });
  });

  describe('Algorithm 3: Binary Tree Postorder Traversal', () => {
    it('matches independent oracle postorder traversal on multi-level tree', () => {
      const input = [4, 2, 6, 1, 3, 5, 7];
      const steps = binaryTreePostorderDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(5);

      const finalStep = steps[steps.length - 1];
      const oracleRoot = oracleBuildBst(input);
      const expected = oraclePostorder(oracleRoot);

      expect(expected).toEqual([1, 3, 2, 5, 7, 6, 4]);
      expect(finalStep.vars?.output).toBe(expected.join(', '));
    });

    it('handles left-skewed tree', () => {
      const input = [5, 4, 3, 2, 1];
      const steps = binaryTreePostorderDefinition.generate(input) as TreeHeapStep[];
      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.output).toBe('1, 2, 3, 4, 5');
    });
  });

  describe('Algorithm 4: Binary Tree Level-Order (BFS)', () => {
    it('matches independent BFS queue oracle traversal', () => {
      const input = [10, 5, 15, 2, 7, 12, 18];
      const steps = binaryTreeLevelOrderDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(7);

      const finalStep = steps[steps.length - 1];
      const oracleRoot = oracleBuildBst(input);
      const expected = oracleLevelOrder(oracleRoot);

      expect(expected).toEqual([10, 5, 15, 2, 7, 12, 18]);
      expect(finalStep.vars?.output).toBe(expected.join(', '));
    });
  });

  describe('Algorithm 5: BST Search & Insertion', () => {
    it('finds existing key and terminates without modifying tree', () => {
      const input = {
        target: 15,
        numbers: [20, 10, 30, 5, 15, 28, 35],
      };
      const steps = bstSearchInsertDefinition.generate(input) as TreeHeapStep[];
      const matchStep = steps.find(s => s.vars?.action === 'Found Existing Key');
      expect(matchStep).toBeDefined();
      expect(matchStep?.vars?.curr).toBe(15);

      // Verify no node was marked inserted
      const lastStep = steps[steps.length - 1];
      const hasInserted = lastStep.tree.treeNodes.some((n: TreeNode) => n.mark === 'inserted');
      expect(hasInserted).toBe(false);
    });

    it('inserts new key into leaf position and preserves BST ordering', () => {
      const input = {
        target: 25,
        numbers: [20, 10, 30, 5, 15, 28, 35],
      };
      const steps = bstSearchInsertDefinition.generate(input) as TreeHeapStep[];
      const insertStep = steps.find(s => s.vars?.action === 'Node Inserted');
      expect(insertStep).toBeDefined();
      expect(insertStep?.vars?.parent).toBe(28);
      expect(insertStep?.vars?.position).toBe('Left');

      // Check that the new node exists in final tree
      const lastStep = steps[steps.length - 1];
      const insertedNode = lastStep.tree.treeNodes.find((n: TreeNode) => n.val === 25);
      expect(insertedNode).toBeDefined();
      expect(insertedNode?.mark).toBe('inserted');
    });

    it('handles insertion into an empty tree', () => {
      const input = { target: 42, numbers: [] };
      const steps = bstSearchInsertDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(0);
      const lastStep = steps[steps.length - 1];
      expect(lastStep.tree.treeNodes.length).toBe(1);
      expect(lastStep.tree.treeNodes[0].val).toBe(42);
    });
  });

  describe('Algorithm 6: AVL Tree Rotations', () => {
    it('executes LL right rotation and balances [30, 20, 10]', () => {
      const steps = avlTreeRotationsDefinition.generate([30, 20, 10]) as TreeHeapStep[];
      const llStep = steps.find(s => String(s.vars?.rotation).includes('LL'));
      expect(llStep).toBeDefined();

      const lastStep = steps[steps.length - 1];
      expect(lastStep.vars?.status).toBe('Balanced');
      expect(lastStep.tree.treeNodes.length).toBe(3);

      // Root after LL rotation is 20
      const rootNode = lastStep.tree.treeNodes.find((n: TreeNode) => n.id === lastStep.tree.rootId);
      expect(rootNode?.val).toBe(20);
    });

    it('executes RR left rotation and balances [10, 20, 30]', () => {
      const steps = avlTreeRotationsDefinition.generate([10, 20, 30]) as TreeHeapStep[];
      const rrStep = steps.find(s => String(s.vars?.rotation).includes('RR'));
      expect(rrStep).toBeDefined();

      const lastStep = steps[steps.length - 1];
      const rootNode = lastStep.tree.treeNodes.find((n: TreeNode) => n.id === lastStep.tree.rootId);
      expect(rootNode?.val).toBe(20);
    });

    it('executes LR double rotation and balances [30, 10, 20]', () => {
      const steps = avlTreeRotationsDefinition.generate([30, 10, 20]) as TreeHeapStep[];
      const lrStep = steps.find(s => String(s.vars?.rotation).includes('LR'));
      expect(lrStep).toBeDefined();

      const lastStep = steps[steps.length - 1];
      const rootNode = lastStep.tree.treeNodes.find((n: TreeNode) => n.id === lastStep.tree.rootId);
      expect(rootNode?.val).toBe(20);
    });

    it('executes RL double rotation and balances [10, 30, 20]', () => {
      const steps = avlTreeRotationsDefinition.generate([10, 30, 20]) as TreeHeapStep[];
      const rlStep = steps.find(s => String(s.vars?.rotation).includes('RL'));
      expect(rlStep).toBeDefined();

      const lastStep = steps[steps.length - 1];
      const rootNode = lastStep.tree.treeNodes.find((n: TreeNode) => n.id === lastStep.tree.rootId);
      expect(rootNode?.val).toBe(20);
    });
  });

  describe('Algorithm 7: Binary Heap Operations', () => {
    it('constructs min-heap satisfying parent <= children invariant and extracts min', () => {
      const input = [15, 10, 20, 8, 12, 25, 6];
      const steps = binaryHeapOperationsDefinition.generate(input) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(10);

      // Find step after all keys are inserted
      const buildDoneStep = steps.find(s => s.vars?.size === input.length);
      expect(buildDoneStep).toBeDefined();
      expect(buildDoneStep?.vars?.min).toBe(6);

      // Verify Min-Heap Invariant on intermediate heap
      const heapArr = buildDoneStep?.tree.heapArray?.map((c: HeapCell) => Number(c.val)) || [];
      expect(heapArr.length).toBe(input.length);
      for (let i = 0; i < heapArr.length; i++) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < heapArr.length) {
          expect(heapArr[i]).toBeLessThanOrEqual(heapArr[left]);
        }
        if (right < heapArr.length) {
          expect(heapArr[i]).toBeLessThanOrEqual(heapArr[right]);
        }
      }

      // Verify Extract-Min was triggered
      const extractStep = steps.find(s => s.vars?.action === 'Extract-Min');
      expect(extractStep).toBeDefined();
      expect(extractStep?.vars?.removedMin).toBe(6);

      // Verify final step satisfies min-heap invariant with length input.length - 1
      const finalStep = steps[steps.length - 1];
      const finalArr = finalStep.tree.heapArray?.map((c: HeapCell) => Number(c.val)) || [];
      expect(finalArr.length).toBe(input.length - 1);
      for (let i = 0; i < finalArr.length; i++) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < finalArr.length) {
          expect(finalArr[i]).toBeLessThanOrEqual(finalArr[left]);
        }
        if (right < finalArr.length) {
          expect(finalArr[i]).toBeLessThanOrEqual(finalArr[right]);
        }
      }
    });

    it('demonstrates bubble-up when smaller element inserted at leaf', () => {
      const input = [14, 20, 25, 30, 40, 5];
      const steps = binaryHeapOperationsDefinition.generate(input) as TreeHeapStep[];
      const swapStep = steps.find(s => s.vars?.action === 'Bubble-Up Swap');
      expect(swapStep).toBeDefined();
    });

    it('handles single element heap', () => {
      const steps = binaryHeapOperationsDefinition.generate([42]) as TreeHeapStep[];
      expect(steps.length).toBeGreaterThan(0);
      const lastStep = steps[steps.length - 1];
      expect(lastStep.tree.heapArray?.length).toBe(1);
      expect(lastStep.tree.heapArray?.[0].val).toBe(42);
    });
  });
});

