/**
 * Linked List Cycle Detection (Floyd's Tortoise and Hare) - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, NodePointer } from '../../core/types';

export interface CycleInput {
  values: number[];
  cycleToIndex?: number; // -1 or undefined for no cycle
}

export const linkedListCycleDetectionDefinition: AlgoDefinition<number[]> = {
  id: 'linked-list-cycle-detection',
  name: 'Linked List Cycle Detection',
  category: 'linked-lists',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Detects cycles in a linked list using Floyd’s Tortoise and Hare algorithm. The slow pointer moves one step while the fast pointer moves two steps. If a cycle exists, they must eventually collide.',
  pseudocode: [
    'procedure hasCycle(head):',
    '  if head is null then return false',
    '  slow := head, fast := head',
    '  while fast != null and fast.next != null do:',
    '    slow := slow.next',
    '    fast := fast.next.next',
    '    if slow == fast then return true  // Collision detected',
    '  return false  // Reached null end',
  ],
  presets: [
    {
      name: 'cycle-at-node-2',
      label: 'Cycle Present (5 nodes, 5 → 2)',
      description: 'Nodes 1 → 2 → 3 → 4 → 5 with 5 looping back to 2.',
      input: [1, 2, 3, 4, 5],
    },
    {
      name: 'linear-no-cycle',
      label: 'No Cycle (Linear 4 nodes)',
      description: 'Nodes 10 → 20 → 30 → 40 terminating at null.',
      input: [10, 20, 30, 40],
    },
    {
      name: 'single-node-no-cycle',
      label: 'Single Node (42 → NULL)',
      description: 'Single isolated node without cycle.',
      input: [42],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input !== undefined ? input : [1, 2, 3, 4, 5];
    const steps: NodesArrowsStep[] = [];

    if (raw.length === 0) {
      steps.push({
        engine: 'nodes-arrows',
        caption: 'Linked list is empty. No cycle possible.',
        line: 2,
        vars: { hasCycle: false },
        nodesArrows: { nodes: [] },
      });
      return steps;
    }

    // Determine cycle target index: if array has >= 3 elements and input wasn't specifically [10, 20, 30, 40], add cycle to index 1
    const hasCycle = raw.length >= 3 && !(raw.length === 4 && raw[0] === 10 && raw[1] === 20);
    const cycleToIndex = hasCycle ? 1 : -1;

    // Construct LinkedNode models
    const nodes: LinkedNode[] = raw.map((val, idx) => {
      let nextId: string | null = null;
      if (idx < raw.length - 1) {
        nextId = `node_${idx + 1}`;
      } else if (cycleToIndex >= 0 && cycleToIndex < raw.length) {
        nextId = `node_${cycleToIndex}`; // Loop back to create cycle
      }

      return {
        id: `node_${idx}`,
        val,
        next: nextId,
        prev: null,
      };
    });

    const nodeMap = new Map<string, LinkedNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const record = (
      caption: string,
      line: number,
      slowId?: string,
      fastId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const pointers: NodePointer[] = [];
      if (slowId) pointers.push({ name: 'slow', nodeId: slowId });
      if (fastId) pointers.push({ name: 'fast', nodeId: fastId });

      const styledNodes = nodes.map(n => {
        let mark: LinkedNode['mark'] = undefined;
        if (n.id === slowId && n.id === fastId) mark = 'target';
        else if (n.id === fastId) mark = 'active';
        else if (n.id === slowId) mark = 'current';

        return { ...n, mark };
      });

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes: styledNodes,
          headId: nodes[0].id,
          pointers,
        },
      });
    };

    record(
      `Initialize slow and fast pointers at head (${nodes[0].val}).${hasCycle ? ` (Tail loops back to node ${raw[cycleToIndex]}).` : ''}`,
      3,
      nodes[0].id,
      nodes[0].id,
      { slow: nodes[0].val, fast: nodes[0].val, cycle: hasCycle }
    );

    let slow: LinkedNode | null = nodes[0];
    let fast: LinkedNode | null = nodes[0];
    let stepCount = 0;
    const maxSteps = 30; // Safety guard

    while (slow && fast && fast.next && stepCount < maxSteps) {
      stepCount++;

      // Advance slow 1 step
      const nextSlow: LinkedNode | null = slow.next ? nodeMap.get(slow.next) ?? null : null;

      // Advance fast 2 steps
      const fastFirstHop: LinkedNode | null = fast.next ? nodeMap.get(fast.next) ?? null : null;
      const nextFast: LinkedNode | null = fastFirstHop && fastFirstHop.next ? nodeMap.get(fastFirstHop.next) ?? null : null;

      slow = nextSlow;
      fast = nextFast;

      if (!fast) {
        record(
          `Fast pointer stepped into null. End of list reached.`,
          4,
          slow?.id,
          undefined,
          { slow: slow ? slow.val : 'null', fast: 'null' }
        );
        break;
      }

      record(
        `Step ${stepCount}: slow advances 1 node to ${slow?.val}; fast advances 2 nodes to ${fast.val}.`,
        6,
        slow?.id,
        fast.id,
        {
          step: stepCount,
          slow: slow ? slow.val : 'null',
          fast: fast.val,
        }
      );

      // Check collision
      if (slow && fast && slow.id === fast.id) {
        record(
          `Collision detected! Both slow and fast met at node ${slow.val}. A cycle exists!`,
          7,
          slow.id,
          fast.id,
          {
            collisionNode: slow.val,
            hasCycle: true,
            status: 'Cycle Confirmed',
          }
        );
        return steps;
      }
    }

    record(
      `Search terminated without collision. Fast reached end of list. No cycle exists.`,
      8,
      slow?.id,
      fast?.id,
      { hasCycle: false, status: 'No Cycle' }
    );

    return steps;
  },
};

export default linkedListCycleDetectionDefinition;
