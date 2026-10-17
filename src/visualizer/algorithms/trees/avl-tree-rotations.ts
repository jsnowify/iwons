/**
 * AVL Tree Self-Balancing & Rotations - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode } from '../../core/types';
import { assignTreeCoordinates, flattenTreeNodes, InternalTreeNode } from './tree-utils';

export const avlTreeRotationsDefinition: AlgoDefinition<number[]> = {
  id: 'avl-tree-rotations',
  name: 'AVL Tree Self-Balancing',
  category: 'trees',
  engine: 'tree-heap',
  complexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(log n)',
  },
  inputKind: 'numbers',
  blurb: 'Maintains height balance factor within {-1, 0, 1} through 4 rotation cases: Left-Left (Right rotation), Right-Right (Left rotation), Left-Right (Double rotation), and Right-Left (Double rotation).',
  pseudocode: [
    'procedure insert(node, key):',
    '  if node is null then return Node(key)',
    '  if key < node.val then node.left = insert(node.left, key)',
    '  else node.right = insert(node.right, key)',
    '  updateHeight(node); bf = height(node.left) - height(node.right)',
    '  if bf > 1 and key < node.left.val then return rotateRight(node)       // LL',
    '  if bf < -1 and key > node.right.val then return rotateLeft(node)      // RR',
    '  if bf > 1 and key > node.left.val then                                // LR',
    '    node.left = rotateLeft(node.left); return rotateRight(node)',
    '  if bf < -1 and key < node.right.val then                              // RL',
    '    node.right = rotateRight(node.right); return rotateLeft(node)',
    '  return node',
  ],
  presets: [
    {
      name: 'll-imbalance',
      label: 'LL Imbalance (Right Rotation)',
      description: 'Keys [30, 20, 10] trigger a single Right Rotation restoring balance.',
      input: [30, 20, 10],
    },
    {
      name: 'rr-imbalance',
      label: 'RR Imbalance (Left Rotation)',
      description: 'Keys [10, 20, 30] trigger a single Left Rotation restoring balance.',
      input: [10, 20, 30],
    },
    {
      name: 'lr-imbalance',
      label: 'LR Imbalance (Left-Right Double)',
      description: 'Keys [30, 10, 20] trigger a Left rotation on child 10 followed by Right rotation on 30.',
      input: [30, 10, 20],
    },
    {
      name: 'rl-imbalance',
      label: 'RL Imbalance (Right-Left Double)',
      description: 'Keys [10, 30, 20] trigger a Right rotation on child 30 followed by Left rotation on 10.',
      input: [10, 30, 20],
    },
    {
      name: 'multi-insertion',
      label: 'Multi-Key Balancing (7 keys)',
      description: 'Sequential insertion [21, 26, 30, 9, 4, 14, 28] demonstrating sustained AVL balancing.',
      input: [21, 26, 30, 9, 4, 14, 28],
    },
  ],
  generate(input: number[]): TreeHeapStep[] {
    const raw = input && input.length > 0 ? input : [30, 20, 10];
    const steps: TreeHeapStep[] = [];

    let nodeCounter = 0;
    function createNode(val: number): InternalTreeNode {
      return { id: `avl_${nodeCounter++}_${val}`, val, left: null, right: null, height: 1 };
    }

    function height(node: InternalTreeNode | null): number {
      return node ? (node.height ?? 1) : 0;
    }

    function getBalance(node: InternalTreeNode | null): number {
      return node ? height(node.left ?? null) - height(node.right ?? null) : 0;
    }

    function updateHeight(node: InternalTreeNode) {
      node.height = 1 + Math.max(height(node.left ?? null), height(node.right ?? null));
    }

    let root: InternalTreeNode | null = null;
    let activeRotatedIds = new Set<string>();

    const record = (
      caption: string,
      line: number,
      currentNodeId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      assignTreeCoordinates(root);
      const allNodes = flattenTreeNodes(root);

      const nodes: TreeNode[] = allNodes.map(n => {
        let mark: TreeNode['mark'] = undefined;
        if (activeRotatedIds.has(n.id)) mark = 'rotated';
        else if (n.id === currentNodeId) mark = 'current';

        return { ...n, mark };
      });

      steps.push({
        engine: 'tree-heap',
        caption,
        line,
        vars,
        tree: {
          treeNodes: nodes,
          rootId: root?.id,
          callStack: [
            ...(vars?.key !== undefined ? [{ label: 'inserting key', args: String(vars.key) }] : []),
            ...(vars?.bf !== undefined ? [{ label: 'balance factor', args: String(vars.bf) }] : []),
            ...(vars?.rotation ? [{ label: 'rotation', args: String(vars.rotation) }] : []),
          ],
        },
      });
    };

    function rotateRight(y: InternalTreeNode): InternalTreeNode {
      const x = y.left!;
      const T2 = x.right ?? null;

      x.right = y;
      y.left = T2;

      updateHeight(y);
      updateHeight(x);

      activeRotatedIds = new Set([x.id, y.id]);
      return x;
    }

    function rotateLeft(x: InternalTreeNode): InternalTreeNode {
      const y = x.right!;
      const T2 = y.left ?? null;

      y.left = x;
      x.right = T2;

      updateHeight(x);
      updateHeight(y);

      activeRotatedIds = new Set([x.id, y.id]);
      return y;
    }

    function insert(node: InternalTreeNode | null, key: number): InternalTreeNode {
      if (!node) {
        const fresh = createNode(key);
        activeRotatedIds.clear();
        return fresh;
      }

      if (key < node.val) {
        node.left = insert(node.left ?? null, key);
      } else if (key > node.val) {
        node.right = insert(node.right ?? null, key);
      } else {
        return node; // Duplicate keys not inserted
      }

      updateHeight(node);
      const bf = getBalance(node);

      // LL Case
      if (bf > 1 && node.left && key < node.left.val) {
        record(
          `Node ${node.val} balance factor is ${bf} (> 1) with key ${key} < left child ${node.left.val}. Triggering LL Right Rotation.`,
          6,
          node.id,
          { node: node.val, bf, rotation: 'LL (Right Rotation)' }
        );
        const rotated = rotateRight(node);
        record(
          `Completed LL Right Rotation. Subtree root is now ${rotated.val}.`,
          6,
          rotated.id,
          { root: rotated.val, rotation: 'LL Complete' }
        );
        return rotated;
      }

      // RR Case
      if (bf < -1 && node.right && key > node.right.val) {
        record(
          `Node ${node.val} balance factor is ${bf} (< -1) with key ${key} > right child ${node.right.val}. Triggering RR Left Rotation.`,
          7,
          node.id,
          { node: node.val, bf, rotation: 'RR (Left Rotation)' }
        );
        const rotated = rotateLeft(node);
        record(
          `Completed RR Left Rotation. Subtree root is now ${rotated.val}.`,
          7,
          rotated.id,
          { root: rotated.val, rotation: 'RR Complete' }
        );
        return rotated;
      }

      // LR Case
      if (bf > 1 && node.left && key > node.left.val) {
        record(
          `Node ${node.val} balance factor is ${bf} (> 1) with key ${key} > left child ${node.left.val}. Triggering LR Double Rotation. Step 1: Left rotate child ${node.left.val}.`,
          8,
          node.left.id,
          { node: node.left.val, bf, rotation: 'LR (Left on child)' }
        );
        node.left = rotateLeft(node.left);
        record(
          `Step 2: Right rotate node ${node.val}.`,
          9,
          node.id,
          { node: node.val, rotation: 'LR (Right on parent)' }
        );
        const rotated = rotateRight(node);
        record(
          `Completed LR Double Rotation. Subtree root is now ${rotated.val}.`,
          9,
          rotated.id,
          { root: rotated.val, rotation: 'LR Complete' }
        );
        return rotated;
      }

      // RL Case
      if (bf < -1 && node.right && key < node.right.val) {
        record(
          `Node ${node.val} balance factor is ${bf} (< -1) with key ${key} < right child ${node.right.val}. Triggering RL Double Rotation. Step 1: Right rotate child ${node.right.val}.`,
          10,
          node.right.id,
          { node: node.right.val, bf, rotation: 'RL (Right on child)' }
        );
        node.right = rotateRight(node.right);
        record(
          `Step 2: Left rotate node ${node.val}.`,
          11,
          node.id,
          { node: node.val, rotation: 'RL (Left on parent)' }
        );
        const rotated = rotateLeft(node);
        record(
          `Completed RL Double Rotation. Subtree root is now ${rotated.val}.`,
          11,
          rotated.id,
          { root: rotated.val, rotation: 'RL Complete' }
        );
        return rotated;
      }

      return node;
    }

    // Step-by-step sequential insertion of keys
    for (const key of raw) {
      activeRotatedIds.clear();
      record(`Insert key ${key} into AVL tree.`, 2, undefined, { key, action: 'Insert' });
      root = insert(root, key);
      activeRotatedIds.clear();
      record(`Key ${key} inserted. Tree balance verified.`, 5, undefined, {
        key,
        root: root?.val ?? 'null',
        height: root?.height ?? 1,
      });
    }

    record('AVL Tree construction and balancing complete.', 12, undefined, {
      totalNodes: raw.length,
      finalHeight: root?.height ?? 0,
      status: 'Balanced',
    });

    return steps;
  },
};

export default avlTreeRotationsDefinition;

