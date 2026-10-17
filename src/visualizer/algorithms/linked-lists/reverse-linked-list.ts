/**
 * Reverse Linked List - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, NodePointer } from '../../core/types';

export const reverseLinkedListDefinition: AlgoDefinition<number[]> = {
  id: 'reverse-linked-list',
  name: 'Reverse Linked List',
  category: 'linked-lists',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Iteratively reverses a singly linked list in-place by maintaining prev, curr, and next pointers, flipping each node’s next pointer backward until reaching the null end.',
  pseudocode: [
    'procedure reverseList(head):',
    '  prev := null',
    '  curr := head',
    '  while curr != null do:',
    '    next := curr.next',
    '    curr.next := prev',
    '    prev := curr',
    '    curr := next',
    '  return prev',
  ],
  presets: [
    {
      name: 'five-nodes',
      label: '5 Nodes (1 → 2 → 3 → 4 → 5)',
      description: 'Standard 5-node list reversal.',
      input: [1, 2, 3, 4, 5],
    },
    {
      name: 'three-nodes',
      label: '3 Nodes (10 → 20 → 30)',
      description: 'Quick walkthrough of pointer flipping.',
      input: [10, 20, 30],
    },
    {
      name: 'single-node',
      label: 'Single Node (42)',
      description: 'Base case of a 1-node list.',
      input: [42],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input?.length ? input : [1, 2, 3, 4, 5];
    const steps: NodesArrowsStep[] = [];

    // Construct node models
    const initialNodes: LinkedNode[] = raw.map((val, idx) => ({
      id: `node_${idx}`,
      val,
      next: idx < raw.length - 1 ? `node_${idx + 1}` : null,
      prev: null,
    }));

    // Current next pointers map
    const nextMap: Record<string, string | null> = {};
    initialNodes.forEach(n => {
      nextMap[n.id] = n.next ?? null;
    });

    const record = (
      caption: string,
      line: number,
      pointers: NodePointer[],
      headId: string | null,
      vars?: Record<string, string | number | boolean>
    ) => {
      const nodes: LinkedNode[] = initialNodes.map(n => ({
        id: n.id,
        val: n.val,
        next: nextMap[n.id],
        mark: pointers.some(p => p.nodeId === n.id && p.name === 'curr')
          ? 'active'
          : pointers.some(p => p.nodeId === n.id && p.name === 'prev')
          ? 'current'
          : undefined,
      }));

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes,
          headId,
          pointers,
        },
      });
    };

    if (raw.length === 0) {
      record('List is empty. Returning null.', 9, [], null, { head: 'null' });
      return steps;
    }

    record('Initialize prev := null and curr := head.', 3, [
      { name: 'curr', nodeId: initialNodes[0].id },
    ], initialNodes[0].id, { prev: 'null', curr: initialNodes[0].val });

    let prevId: string | null = null;
    let currId: string | null = initialNodes[0].id;

    while (currId !== null) {
      const nextId: string | null = nextMap[currId];
      const currNode = initialNodes.find(n => n.id === currId)!;
      const nextNode = initialNodes.find(n => n.id === nextId);

      const pointers: NodePointer[] = [];
      if (prevId) pointers.push({ name: 'prev', nodeId: prevId });
      pointers.push({ name: 'curr', nodeId: currId });
      if (nextId) pointers.push({ name: 'next', nodeId: nextId });

      record(
        `Save next pointer: next := curr.next (${nextNode ? nextNode.val : 'null'}).`,
        5,
        pointers,
        initialNodes[0].id,
        {
          prev: prevId ? initialNodes.find(n => n.id === prevId)!.val : 'null',
          curr: currNode.val,
          next: nextNode ? nextNode.val : 'null',
        }
      );

      // Flip pointer
      nextMap[currId] = prevId;
      const prevVal = prevId ? initialNodes.find(n => n.id === prevId)!.val : 'null';

      record(
        `Reverse link: set curr.next (${currNode.val} → ${prevVal}).`,
        6,
        pointers,
        currId,
        {
          curr: currNode.val,
          'curr.next': prevVal,
        }
      );

      prevId = currId;
      currId = nextId;

      const advancePointers: NodePointer[] = [{ name: 'prev', nodeId: prevId }];
      if (currId) advancePointers.push({ name: 'curr', nodeId: currId });

      record(
        `Advance pointers: prev := ${currNode.val}, curr := ${currId ? initialNodes.find(n => n.id === currId)!.val : 'null'}.`,
        8,
        advancePointers,
        prevId,
        {
          prev: initialNodes.find(n => n.id === prevId)!.val,
          curr: currId ? initialNodes.find(n => n.id === currId)!.val : 'null',
        }
      );
    }

    const finalHead = prevId;
    record(
      `Reversal complete. New head of reversed list is node ${finalHead ? initialNodes.find(n => n.id === finalHead)!.val : 'null'}.`,
      9,
      finalHead ? [{ name: 'head', nodeId: finalHead }] : [],
      finalHead,
      { newHead: finalHead ? initialNodes.find(n => n.id === finalHead)!.val : 'null' }
    );

    return steps;
  },
};

export default reverseLinkedListDefinition;

