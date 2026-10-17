/**
 * BST Search & Insertion - Engine 5 (Tree & Heap)
 */

import { AlgoDefinition, TreeHeapStep, TreeNode } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';
import { assignTreeCoordinates, flattenTreeNodes, InternalTreeNode } from './tree-utils';

export const bstSearchInsertDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'bst-search-insert',
  name: 'BST Search & Insertion',
  category: 'trees',
  engine: 'tree-heap',
  complexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(n)',
    space: 'O(h)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Traverses binary search tree by comparing the key to each node. If found, returns the node. If a null pointer is encountered, grafts a new node into the correct leaf position.',
  pseudocode: [
    'procedure searchAndInsert(root, key):',
    '  curr = root, parent = null',
    '  while curr is not null:',
    '    if key == curr.val then return FOUND',
    '    parent = curr',
    '    if key < curr.val then curr = curr.left',
    '    else curr = curr.right',
    '  newNode = createNode(key)',
    '  attach newNode to parent (left or right)',
  ],
  presets: [
    {
      name: 'search-existing-key',
      label: 'Search Existing Key (15)',
      description: 'Finds key 15 in a balanced BST without modifying tree.',
      input: {
        target: 15,
        numbers: [20, 10, 30, 5, 15, 28, 35],
      },
    },
    {
      name: 'insert-new-leaf',
      label: 'Insert New Key (25)',
      description: 'Navigates to the empty left branch of node 28 and inserts 25.',
      input: {
        target: 25,
        numbers: [20, 10, 30, 5, 15, 28, 35],
      },
    },
    {
      name: 'insert-extremum',
      label: 'Insert Smallest Key (2)',
      description: 'Inserts key 2 at the leftmost position of the tree.',
      input: {
        target: 2,
        numbers: [20, 10, 30, 5, 15],
      },
    },
  ],
  generate(input: TargetAndNumbers): TreeHeapStep[] {
    const target = input?.target !== undefined ? input.target : 25;
    const initialKeys = input?.numbers !== undefined ? input.numbers : [20, 10, 30, 5, 15, 28, 35];

    let counter = 0;
    function makeNode(val: number): InternalTreeNode {
      return { id: `n_${counter++}_${val}`, val, left: null, right: null, height: 1 };
    }

    let root: InternalTreeNode | null = null;
    function insertInitial(node: InternalTreeNode | null, val: number): InternalTreeNode {
      if (!node) return makeNode(val);
      if (val < node.val) node.left = insertInitial(node.left ?? null, val);
      else if (val > node.val) node.right = insertInitial(node.right ?? null, val);
      return node;
    }

    for (const k of initialKeys) {
      root = insertInitial(root, k);
    }
    assignTreeCoordinates(root);

    const steps: TreeHeapStep[] = [];
    const visitedSet = new Set<string>();

    const record = (
      caption: string,
      line: number,
      currentNodeId?: string,
      insertedNodeId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const nodes: TreeNode[] = flattenTreeNodes(root).map(n => {
        let mark: TreeNode['mark'] = undefined;
        if (n.id === insertedNodeId) mark = 'inserted';
        else if (n.id === currentNodeId) mark = 'current';
        else if (visitedSet.has(n.id)) mark = 'visited';

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
            { label: 'target key', args: String(target) },
            ...(currentNodeId ? [{ label: 'current node', args: String(vars?.curr ?? currentNodeId) }] : []),
            ...(vars?.action ? [{ label: 'action', args: String(vars.action) }] : []),
          ],
        },
      });
    };

    if (!root) {
      root = makeNode(target);
      assignTreeCoordinates(root);
      record(`Tree was empty. Created root node with key ${target}.`, 8, undefined, root.id, {
        target,
        action: 'Inserted Root',
      });
      return steps;
    }

    record(`Begin BST search for key ${target} starting at root (${root.val}).`, 1, root.id, undefined, {
      curr: root.val,
      target,
    });

    let curr: InternalTreeNode | null = root;
    let parent: InternalTreeNode | null = null;
    let found = false;

    while (curr !== null) {
      visitedSet.add(curr.id);

      if (target === curr.val) {
        found = true;
        record(`Key ${target} matches current node ${curr.val}! Key already exists in BST.`, 4, curr.id, undefined, {
          curr: curr.val,
          target,
          action: 'Found Existing Key',
        });
        break;
      }

      parent = curr;
      if (target < curr.val) {
        record(
          `Key ${target} < ${curr.val}. Move left branch to ${curr.left ? curr.left.val : 'NULL'}.`,
          6,
          curr.id,
          undefined,
          { curr: curr.val, target, branch: 'Left' }
        );
        curr = curr.left ?? null;
      } else {
        record(
          `Key ${target} > ${curr.val}. Move right branch to ${curr.right ? curr.right.val : 'NULL'}.`,
          7,
          curr.id,
          undefined,
          { curr: curr.val, target, branch: 'Right' }
        );
        curr = curr.right ?? null;
      }
    }

    if (!found && parent !== null) {
      const newNode = makeNode(target);
      if (target < parent.val) {
        parent.left = newNode;
      } else {
        parent.right = newNode;
      }

      // Re-layout tree with the new node
      assignTreeCoordinates(root);

      record(
        `Reached null branch. Attached new node ${target} as ${target < parent.val ? 'left' : 'right'} child of ${parent.val}.`,
        9,
        undefined,
        newNode.id,
        {
          target,
          parent: parent.val,
          position: target < parent.val ? 'Left' : 'Right',
          action: 'Node Inserted',
        }
      );

      record(
        `BST property preserved. New key ${target} is successfully integrated.`,
        9,
        undefined,
        newNode.id,
        { target, status: 'Done' }
      );
    }

    return steps;
  },
};

export default bstSearchInsertDefinition;
