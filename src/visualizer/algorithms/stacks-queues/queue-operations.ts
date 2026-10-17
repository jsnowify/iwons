/**
 * Queue Enqueue & Dequeue Operations (FIFO) - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, NodePointer } from '../../core/types';

export const queueOperationsDefinition: AlgoDefinition<number[]> = {
  id: 'queue-operations',
  name: 'Queue Enqueue & Dequeue',
  category: 'stacks-queues',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(1)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Implements a First-In-First-Out (FIFO) queue using a singly linked list. Enqueue appends at the rear pointer, while Dequeue removes from the front pointer, achieving strict O(1) time complexity for both operations.',
  pseudocode: [
    'procedure enqueue(val):',
    '  newNode = createNode(val)',
    '  if rear is null then front = rear = newNode',
    '  else rear.next = newNode; rear = newNode',
    'procedure dequeue():',
    '  if front is null then return UNDERFLOW',
    '  dequeued = front',
    '  front = front.next',
    '  if front is null then rear = null',
    '  return dequeued.val',
  ],
  presets: [
    {
      name: 'enqueue-five-dequeue-two',
      label: 'Enqueue 5, Dequeue 2',
      description: 'Enqueues [10, 20, 30, 40, 50], then dequeues 10 and 20 from front.',
      input: [10, 20, 30, 40, 50],
    },
    {
      name: 'enqueue-three-dequeue-one',
      label: 'Enqueue 3, Dequeue 1',
      description: 'Enqueues [15, 30, 45], then dequeues 15.',
      input: [15, 30, 45],
    },
    {
      name: 'single-element',
      label: 'Single Element FIFO',
      description: 'Enqueues 42 and immediately dequeues it.',
      input: [42],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input !== undefined && input.length > 0 ? input.slice(0, 7) : [10, 20, 30, 40, 50];
    const steps: NodesArrowsStep[] = [];

    // Internal linked queue representation
    let queueNodes: LinkedNode[] = [];
    let frontId: string | null = null;
    let rearId: string | null = null;
    let nodeCounter = 0;

    const record = (
      caption: string,
      line: number,
      activeNodeId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const pointers: NodePointer[] = [];
      if (frontId) pointers.push({ name: 'front', nodeId: frontId });
      if (rearId && rearId !== frontId) pointers.push({ name: 'rear', nodeId: rearId });

      const styledNodes = queueNodes.map(n => {
        let mark: LinkedNode['mark'] = undefined;
        if (n.id === activeNodeId) mark = 'active';
        else if (n.id === frontId) mark = 'current';
        else if (n.id === rearId) mark = 'target';

        return { ...n, mark };
      });

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes: styledNodes,
          headId: frontId,
          pointers,
        },
      });
    };

    record('Initialized empty queue (front := null, rear := null).', 3, undefined, {
      front: 'null',
      rear: 'null',
      size: 0,
    });

    // 1. Enqueue elements
    for (const val of raw) {
      const newNodeId = `queue_${nodeCounter++}_${val}`;
      const newNode: LinkedNode = {
        id: newNodeId,
        val,
        next: null,
        prev: null,
      };

      if (queueNodes.length === 0) {
        queueNodes = [newNode];
        frontId = newNodeId;
        rearId = newNodeId;

        record(
          `enqueue(${val}): queue was empty. Both front and rear now point to node ${val}.`,
          3,
          newNodeId,
          { operation: 'Enqueue', val, front: val, rear: val, size: 1 }
        );
      } else {
        // Link previous rear to newNode
        const prevRear = queueNodes[queueNodes.length - 1];
        prevRear.next = newNodeId;
        queueNodes = [...queueNodes, newNode];
        rearId = newNodeId;

        record(
          `enqueue(${val}): linked node ${prevRear.val}.next → ${val}. Advanced rear pointer to ${val}.`,
          4,
          newNodeId,
          { operation: 'Enqueue', val, front: queueNodes[0].val, rear: val, size: queueNodes.length }
        );
      }
    }

    record(
      `All ${raw.length} elements enqueued. Front is ${queueNodes[0].val}, Rear is ${queueNodes[queueNodes.length - 1].val}.`,
      4,
      undefined,
      { front: queueNodes[0].val, rear: queueNodes[queueNodes.length - 1].val, size: queueNodes.length }
    );

    // 2. Dequeue elements
    const dequeueCount = Math.min(2, queueNodes.length);
    for (let d = 0; d < dequeueCount; d++) {
      if (queueNodes.length === 0) break;

      const dequeuedNode = queueNodes[0];
      const nextFront = queueNodes[1] ?? null;

      record(
        `dequeue(): removing front node ${dequeuedNode.val}. Next front will be ${nextFront ? nextFront.val : 'null'}.`,
        7,
        dequeuedNode.id,
        { operation: 'Dequeue', dequeued: dequeuedNode.val, nextFront: nextFront ? nextFront.val : 'null' }
      );

      queueNodes = queueNodes.slice(1);
      frontId = nextFront ? nextFront.id : null;
      if (!frontId) rearId = null;

      record(
        `Dequeued ${dequeuedNode.val} successfully. Queue size is now ${queueNodes.length}.`,
        9,
        frontId ?? undefined,
        {
          dequeued: dequeuedNode.val,
          front: frontId ? queueNodes[0].val : 'null',
          rear: rearId ? queueNodes[queueNodes.length - 1].val : 'null',
          size: queueNodes.length,
        }
      );
    }

    record(
      `Queue operations finished. Final queue size is ${queueNodes.length}.`,
      10,
      frontId ?? undefined,
      {
        size: queueNodes.length,
        front: frontId ? queueNodes[0].val : 'null',
        rear: rearId ? queueNodes[queueNodes.length - 1].val : 'null',
      }
    );

    return steps;
  },
};

export default queueOperationsDefinition;
