/**
 * Binary Tree Level-Order (BFS) Traversal - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode } from '../../core/types';
import { buildBst, flattenTreeNodes } from './tree-utils';

export const binaryTreeLevelOrderDefinition: AlgoDefinition<number[]> = {
  id: 'binary-tree-level-order',
  name: 'Binary Tree Level-Order (BFS)',
  category: 'trees',
  engine: 'tree-heap',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(w)',
  },
  inputKind: 'tree',
  blurb: 'Explores the binary tree level by level from top to bottom and left to right using an explicit FIFO queue. Essential for finding shortest paths in unweighted trees, level summaries, and tree serialization.',
  pseudocode: [
    'procedure levelOrder(root):',
    '  if root is null then return',
    '  queue.enqueue(root)',
    '  while queue is not empty:',
    '    node = queue.dequeue()',
    '    visit(node)',
    '    if node.left then queue.enqueue(node.left)',
    '    if node.right then queue.enqueue(node.right)',
  ],
  presets: [
    {
      name: 'balanced-bst',
      label: 'Balanced BST (7 nodes)',
      description: 'Standard binary tree where BFS visits level 0 (4), level 1 (2, 6), level 2 (1, 3, 5, 7).',
      input: [4, 2, 6, 1, 3, 5, 7],
    },
    {
      name: 'asymmetric-tree',
      label: 'Asymmetric Tree',
      description: 'Tree with varying branch depths.',
      input: [10, 5, 15, 2, 7, 12, 18],
    },
    {
      name: 'single-element',
      label: 'Single Root Node',
      description: 'Tree with only one element.',
      input: [42],
    },
  ],
  generate(input: number[]): TreeHeapStep[] {
    const raw = input && input.length > 0 ? input : [4, 2, 6, 1, 3, 5, 7];
    const root = buildBst(raw);
    const allTreeNodes = flattenTreeNodes(root);
    const steps: TreeHeapStep[] = [];
    const visitedNodes = new Set<string>();
    const outputList: (number | string)[] = [];

    if (!root) {
      steps.push({
        engine: 'tree-heap',
        caption: 'Tree is empty. Nothing to traverse.',
        line: 2,
        tree: { treeNodes: [] },
      });
      return steps;
    }

    interface QueueItem {
      node: typeof root;
      level: number;
    }

    const queue: QueueItem[] = [{ node: root, level: 0 }];

    const record = (
      caption: string,
      line: number,
      currentNodeId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const nodes: TreeNode[] = allTreeNodes.map(n => {
        let mark: TreeNode['mark'] = undefined;
        if (n.id === currentNodeId) mark = 'current';
        else if (visitedNodes.has(n.id)) mark = 'visited';

        return { ...n, mark };
      });

      steps.push({
        engine: 'tree-heap',
        caption,
        line,
        vars,
        tree: {
          treeNodes: nodes,
          rootId: root.id,
          callStack: [
            { label: 'queue', args: queue.map(q => q.node.val).join(', ') || 'empty' },
            { label: 'output', args: outputList.join(', ') || '[]' },
          ],
        },
      });
    };

    record(`Initialize BFS queue with root node ${root.val}.`, 3, root.id, {
      queue: String(root.val),
      level: 0,
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const node = curr.node;
      const level = curr.level;

      visitedNodes.add(node.id);
      outputList.push(node.val);

      record(
        `Dequeue and visit node ${node.val} at level ${level}. Append to output: [${outputList.join(', ')}].`,
        5,
        node.id,
        {
          node: node.val,
          level,
          output: outputList.join(', '),
        }
      );

      if (node.left) {
        queue.push({ node: node.left, level: level + 1 });
        record(
          `Enqueue left child ${node.left.val} of node ${node.val}.`,
          7,
          node.id,
          { enqueued: node.left.val, level: level + 1 }
        );
      }

      if (node.right) {
        queue.push({ node: node.right, level: level + 1 });
        record(
          `Enqueue right child ${node.right.val} of node ${node.val}.`,
          8,
          node.id,
          { enqueued: node.right.val, level: level + 1 }
        );
      }
    }

    record(
      `Level-order traversal complete. Final BFS sequence: [${outputList.join(', ')}].`,
      4,
      undefined,
      { output: outputList.join(', ') }
    );

    return steps;
  },
};

export default binaryTreeLevelOrderDefinition;
