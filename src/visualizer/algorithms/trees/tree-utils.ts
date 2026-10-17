/**
 * Shared Tree Utilities for Engine 5 (Tree & Heap)
 *
 * Implements Knuth's inorder tree layout, node positioning,
 * and binary tree transformations.
 */

import { TreeNode } from '../../core/types';

export interface InternalTreeNode {
  id: string;
  val: number;
  left?: InternalTreeNode | null;
  right?: InternalTreeNode | null;
  x?: number;
  y?: number;
  depth?: number;
  height?: number;
}

/**
 * Assigns x and y coordinates to nodes using Knuth's in-order layout.
 * Guarantees left-child.x < parent.x < right-child.x with zero edge-crossing
 * within the tree viewport (x: 30..530, y: 40..260).
 */
export function assignTreeCoordinates(root: InternalTreeNode | null, maxTreeWidth: number = 500, startX: number = 30): void {
  if (!root) return;

  let inorderCounter = 0;
  const nodesInOrder: InternalTreeNode[] = [];

  function computeDepthAndInorder(node: InternalTreeNode | null, depth: number) {
    if (!node) return;
    node.depth = depth;
    computeDepthAndInorder(node.left ?? null, depth + 1);
    node.x = 0; // placeholder
    nodesInOrder.push(node);
    inorderCounter++;
    computeDepthAndInorder(node.right ?? null, depth + 1);
  }

  computeDepthAndInorder(root, 0);

  const total = nodesInOrder.length;
  const stepX = total > 1 ? maxTreeWidth / (total - 1) : maxTreeWidth / 2;

  nodesInOrder.forEach((node, idx) => {
    node.x = Math.round(startX + (total === 1 ? maxTreeWidth / 2 : idx * stepX));
    const d = node.depth ?? 0;
    node.y = Math.min(270, d * 55 + 40);
  });
}

/**
 * Builds a standard Binary Search Tree from a sequence of keys.
 */
export function buildBst(values: number[]): InternalTreeNode | null {
  if (!values || values.length === 0) return null;

  let root: InternalTreeNode | null = null;
  let counter = 0;

  function insertNode(node: InternalTreeNode | null, val: number): InternalTreeNode {
    if (!node) {
      return { id: `node_${counter++}_${val}`, val, left: null, right: null, height: 1 };
    }
    if (val < node.val) {
      node.left = insertNode(node.left ?? null, val);
    } else {
      node.right = insertNode(node.right ?? null, val);
    }
    return node;
  }

  for (const v of values) {
    root = insertNode(root, v);
  }

  assignTreeCoordinates(root);
  return root;
}

/**
 * Flattens an internal tree into TreeNode array required by TreeHeapStep.
 */
export function flattenTreeNodes(root: InternalTreeNode | null): TreeNode[] {
  if (!root) return [];
  const result: TreeNode[] = [];

  function dfs(node: InternalTreeNode | null) {
    if (!node) return;
    result.push({
      id: node.id,
      val: node.val,
      left: node.left ? node.left.id : undefined,
      right: node.right ? node.right.id : undefined,
      x: node.x,
      y: node.y,
      depth: node.depth,
    });
    dfs(node.left ?? null);
    dfs(node.right ?? null);
  }

  dfs(root);
  return result;
}

/**
 * Deep clones an internal tree to preserve immutable states across frames.
 */
export function cloneInternalTree(root: InternalTreeNode | null): InternalTreeNode | null {
  if (!root) return null;
  return {
    id: root.id,
    val: root.val,
    x: root.x,
    y: root.y,
    depth: root.depth,
    height: root.height,
    left: cloneInternalTree(root.left ?? null),
    right: cloneInternalTree(root.right ?? null),
  };
}

