/**
 * Stack Push & Pop Operations (LIFO) - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, NodePointer } from '../../core/types';

export const stackOperationsDefinition: AlgoDefinition<number[]> = {
  id: 'stack-operations',
  name: 'Stack Push & Pop',
  category: 'stacks-queues',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(1)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Implements a Last-In-First-Out (LIFO) stack. Push creates a new node pointing to the current top, while Pop removes and returns the top node, updating the top pointer in O(1) time.',
  pseudocode: [
    'procedure push(val):',
    '  newNode = createNode(val)',
    '  newNode.next = top',
    '  top = newNode',
    'procedure pop():',
    '  if top is null then return UNDERFLOW',
    '  popped = top',
    '  top = top.next',
    '  return popped.val',
  ],
  presets: [
    {
      name: 'push-five-pop-two',
      label: 'Push 5, Pop 2',
      description: 'Pushes [10, 20, 30, 40, 50], then pops 50 and 40.',
      input: [10, 20, 30, 40, 50],
    },
    {
      name: 'push-three-pop-one',
      label: 'Push 3, Pop 1',
      description: 'Pushes [7, 14, 21], then pops 21.',
      input: [7, 14, 21],
    },
    {
      name: 'single-element',
      label: 'Single Element Push & Pop',
      description: 'Pushes 42 and immediately pops it.',
      input: [42],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input !== undefined && input.length > 0 ? input.slice(0, 7) : [10, 20, 30, 40, 50];
    const steps: NodesArrowsStep[] = [];

    // Internal linked stack representation
    let stackNodes: LinkedNode[] = [];
    let topId: string | null = null;
    let nodeCounter = 0;

    const record = (
      caption: string,
      line: number,
      activeNodeId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const pointers: NodePointer[] = [];
      if (topId) {
        pointers.push({ name: 'top', nodeId: topId });
      }

      const styledNodes = stackNodes.map(n => {
        let mark: LinkedNode['mark'] = undefined;
        if (n.id === activeNodeId) mark = 'active';
        else if (n.id === topId) mark = 'current';

        return { ...n, mark };
      });

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes: styledNodes,
          headId: topId,
          pointers,
        },
      });
    };

    record('Initialized empty stack (top := null).', 4, undefined, {
      top: 'null',
      size: 0,
    });

    // 1. Push elements onto stack
    for (const val of raw) {
      const newNodeId = `stack_${nodeCounter++}_${val}`;
      const newNode: LinkedNode = {
        id: newNodeId,
        val,
        next: topId,
        prev: null,
      };

      // Add node at beginning of array for top-to-bottom or left-to-right top view
      stackNodes = [newNode, ...stackNodes];
      topId = newNodeId;

      record(
        `push(${val}): created new node ${val} pointing to previous top (${newNode.next ? stackNodes.find(n => n.id === newNode.next)?.val : 'null'}).`,
        3,
        newNodeId,
        { operation: 'Push', pushed: val, newTop: val, size: stackNodes.length }
      );
    }

    record(
      `All ${raw.length} elements pushed. Top of stack is ${stackNodes[0].val}.`,
      4,
      stackNodes[0].id,
      { top: stackNodes[0].val, size: stackNodes.length }
    );

    // 2. Pop elements from stack
    const popCount = Math.min(2, stackNodes.length);
    for (let p = 0; p < popCount; p++) {
      if (stackNodes.length === 0) break;

      const poppedNode = stackNodes[0];
      const nextTop = stackNodes[1] ?? null;

      record(
        `pop(): removing top node ${poppedNode.val}. Next top will be ${nextTop ? nextTop.val : 'null'}.`,
        7,
        poppedNode.id,
        { operation: 'Pop', popped: poppedNode.val, newTop: nextTop ? nextTop.val : 'null' }
      );

      // Remove from stack
      stackNodes = stackNodes.slice(1);
      topId = nextTop ? nextTop.id : null;

      record(
        `Popped ${poppedNode.val} successfully. Stack size is now ${stackNodes.length}.`,
        9,
        topId ?? undefined,
        { popped: poppedNode.val, top: nextTop ? nextTop.val : 'null', size: stackNodes.length }
      );
    }

    record(
      `Stack operations complete. Final stack size is ${stackNodes.length}.`,
      9,
      topId ?? undefined,
      { size: stackNodes.length, top: stackNodes[0]?.val ?? 'null' }
    );

    return steps;
  },
};

export default stackOperationsDefinition;
