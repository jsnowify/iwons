/**
 * Binary Tree Preorder Traversal - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode } from '../../core/types';
import { buildBst, flattenTreeNodes } from './tree-utils';

export const binaryTreePreorderDefinition: AlgoDefinition<number[]> = {
  id: 'binary-tree-preorder',
  name: 'Binary Tree Preorder Traversal',
  category: 'trees',
  engine: 'tree-heap',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(h)',
  },
  inputKind: 'tree',
  blurb: 'Visits the root node first, then recursively traverses the left subtree, and finally the right subtree (NLR). Widely used for serializing, cloning, and prefix expression evaluation.',
  pseudocode: [
    'procedure preorder(node):',
    '  if node is null then return',
    '  visit(node)  // record output value',
    '  preorder(node.left)',
    '  preorder(node.right)',
  ],
  presets: [
    {
      name: 'balanced-bst',
      label: 'Balanced BST (7 nodes)',
      description: 'Standard balanced binary tree where preorder visits 4, 2, 1, 3, 6, 5, 7.',
      input: [4, 2, 6, 1, 3, 5, 7],
    },
    {
      name: 'right-leaning',
      label: 'Right-Leaning Subtree',
      description: 'Tree with deeper right branch.',
      input: [10, 5, 20, 2, 8, 15, 25],
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
          rootId: root?.id,
          callStack: [
            { label: 'output', args: outputList.join(', ') || '[]' },
            ...(currentNodeId ? [{ label: 'active node', args: String(vars?.node ?? currentNodeId) }] : []),
          ],
        },
      });
    };

    if (!root) {
      steps.push({
        engine: 'tree-heap',
        caption: 'Tree is empty. Nothing to traverse.',
        line: 2,
        tree: { treeNodes: [] },
      });
      return steps;
    }

    record('Start preorder traversal (Root -> Left -> Right) from root node.', 1, root.id, { root: root.val });

    function traverse(node: typeof root) {
      if (!node) {
        record('Reached null branch. Return to caller.', 2);
        return;
      }

      // 1. Visit root first
      visitedNodes.add(node.id);
      outputList.push(node.val);
      record(
        `Visit root node ${node.val}. Append to preorder output: [${outputList.join(', ')}].`,
        3,
        node.id,
        { node: node.val, output: outputList.join(', ') }
      );

      // 2. Traverse left subtree
      record(`Traverse left subtree of node ${node.val}.`, 4, node.id, { node: node.val });
      traverse(node.left ?? null);

      // 3. Traverse right subtree
      record(`Traverse right subtree of node ${node.val}.`, 5, node.id, { node: node.val });
      traverse(node.right ?? null);
    }

    traverse(root);

    record(
      `Preorder traversal complete. Final sequence: [${outputList.join(', ')}].`,
      5,
      undefined,
      { output: outputList.join(', ') }
    );

    return steps;
  },
};

export default binaryTreePreorderDefinition;

