/**
 * Binary Tree Inorder Traversal - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode } from '../../core/types';

export const binaryTreeInorderDefinition: AlgoDefinition<number[]> = {
  id: 'binary-tree-inorder',
  name: 'Binary Tree Inorder Traversal',
  category: 'trees',
  engine: 'tree-heap',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(h)',
  },
  inputKind: 'tree',
  blurb: 'Recursively visits the left subtree, the root node, and then the right subtree (LNR). On a Binary Search Tree, this produces elements in strictly ascending sorted order.',
  pseudocode: [
    'procedure inorder(node):',
    '  if node is null then return',
    '  inorder(node.left)',
    '  visit(node)  // record output value',
    '  inorder(node.right)',
  ],
  presets: [
    {
      name: 'balanced-bst',
      label: 'Balanced BST (7 nodes)',
      description: 'Standard 3-level tree where inorder gives 1, 2, 3, 4, 5, 6, 7.',
      input: [4, 2, 6, 1, 3, 5, 7],
    },
    {
      name: 'unbalanced-right',
      label: 'Right-Leaning Subtree',
      description: 'Tree with deeper right branch.',
      input: [10, 5, 20, 2, 8, 15, 25],
    },
  ],
  generate(input: number[]): TreeHeapStep[] {
    const raw = input?.length ? input : [4, 2, 6, 1, 3, 5, 7];

    // Build binary search tree from input values
    interface InternalNode {
      id: string;
      val: number;
      left?: InternalNode;
      right?: InternalNode;
      x?: number;
      y?: number;
    }

    let root: InternalNode | null = null;

    function insert(node: InternalNode | null, val: number, id: string): InternalNode {
      if (!node) return { id, val };
      if (val < node.val) node.left = insert(node.left ?? null, val, id);
      else node.right = insert(node.right ?? null, val, id);
      return node;
    }

    for (let i = 0; i < raw.length; i++) {
      root = insert(root, raw[i], `n${i}_${raw[i]}`);
    }

    // Assign layout coordinates (x, y)
    function assignPositions(node: InternalNode | null, leftBound: number, rightBound: number, depth: number) {
      if (!node) return;
      const x = Math.round((leftBound + rightBound) / 2);
      const y = depth * 55 + 40;
      node.x = x;
      node.y = y;
      assignPositions(node.left ?? null, leftBound, x, depth + 1);
      assignPositions(node.right ?? null, x, rightBound, depth + 1);
    }
    assignPositions(root, 30, 370, 0);

    // Flatten into TreeNode list for steps
    function flatten(node: InternalNode | null): TreeNode[] {
      if (!node) return [];
      return [
        {
          id: node.id,
          val: node.val,
          left: node.left?.id,
          right: node.right?.id,
          x: node.x,
          y: node.y,
        },
        ...flatten(node.left ?? null),
        ...flatten(node.right ?? null),
      ];
    }

    const allTreeNodes = flatten(root);
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

        return {
          ...n,
          mark,
        };
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
          ],
        },
      });
    };

    record('Start inorder traversal from root node.', 1, root?.id, { root: root?.val ?? 'null' });

    function traverse(node: InternalNode | null) {
      if (!node) {
        record('Reached null branch. Return to caller.', 2);
        return;
      }

      record(`Traverse left subtree of node ${node.val}.`, 3, node.id, { node: node.val });
      traverse(node.left ?? null);

      visitedNodes.add(node.id);
      outputList.push(node.val);
      record(
        `Visit node ${node.val}. Append to inorder output: [${outputList.join(', ')}].`,
        4,
        node.id,
        { node: node.val, output: outputList.join(', ') }
      );

      record(`Traverse right subtree of node ${node.val}.`, 5, node.id, { node: node.val });
      traverse(node.right ?? null);
    }

    traverse(root);

    record(
      `Inorder traversal complete. Final ordered sequence: [${outputList.join(', ')}].`,
      5,
      undefined,
      { output: outputList.join(', ') }
    );

    return steps;
  },
};

export default binaryTreeInorderDefinition;

