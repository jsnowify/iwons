import { describe, it, expect } from 'vitest';
import reverseLinkedListDefinition from '../visualizer/algorithms/linked-lists/reverse-linked-list';
import linkedListCycleDetectionDefinition from '../visualizer/algorithms/linked-lists/linked-list-cycle-detection';
import stackOperationsDefinition from '../visualizer/algorithms/stacks-queues/stack-operations';
import queueOperationsDefinition from '../visualizer/algorithms/stacks-queues/queue-operations';
import hashTableChainingDefinition from '../visualizer/algorithms/hashing/hash-table-chaining';
import lruCacheDefinition from '../visualizer/algorithms/hashing/lru-cache';
import { loadAlgorithmDefinition } from '../visualizer/registry';
import { NodesArrowsStep, LinkedNode, HashBucket } from '../visualizer/core/types';

describe('Engine 6: Nodes & Arrows Algorithms', () => {
  describe('Registry Dynamic Import Integration', () => {
    it('successfully loads all 6 Nodes & Arrows algorithm definitions via registry', async () => {
      const ids = [
        'reverse-linked-list',
        'linked-list-cycle-detection',
        'stack-operations',
        'queue-operations',
        'hash-table-chaining',
        'lru-cache',
      ];

      for (const id of ids) {
        const def = await loadAlgorithmDefinition(id);
        expect(def, `Algorithm ${id} should load successfully`).not.toBeNull();
        expect(def?.id).toBe(id);
        expect(def?.engine).toBe('nodes-arrows');
        expect(typeof def?.generate).toBe('function');
      }
    });
  });

  describe('Algorithm 1: Reverse Linked List', () => {
    it('reverses a 5-node list in-place and preserves all values', () => {
      const input = [1, 2, 3, 4, 5];
      const steps = reverseLinkedListDefinition.generate(input) as NodesArrowsStep[];
      expect(steps.length).toBeGreaterThan(5);

      const finalStep = steps[steps.length - 1];
      const finalHead = finalStep.nodesArrows.headId;
      expect(finalHead).toBeDefined();

      const nodeMap = new Map<string, LinkedNode>();
      finalStep.nodesArrows.nodes.forEach((n: LinkedNode) => nodeMap.set(n.id, n));

      // Follow next pointers from finalHead to build reversed list
      const reversedValues: number[] = [];
      let currId: string | null = finalHead ?? null;
      while (currId) {
        const node = nodeMap.get(currId);
        expect(node).toBeDefined();
        reversedValues.push(Number(node!.val));
        currId = node!.next ?? null;
      }

      expect(reversedValues).toEqual([5, 4, 3, 2, 1]);
    });

    it('handles single node and empty list edge cases', () => {
      const singleSteps = reverseLinkedListDefinition.generate([42]) as NodesArrowsStep[];
      const singleLast = singleSteps[singleSteps.length - 1];
      expect(singleLast.nodesArrows.nodes.length).toBe(1);
      expect(singleLast.nodesArrows.nodes[0].val).toBe(42);

      const emptySteps = reverseLinkedListDefinition.generate([]) as NodesArrowsStep[];
      expect(emptySteps.length).toBeGreaterThan(0);
      expect(emptySteps[0].nodesArrows.nodes.length).toBe(0);
    });
  });

  describe('Algorithm 2: Linked List Cycle Detection (Floyd)', () => {
    it('detects a cycle when tail loops back to intermediate node', () => {
      const input = [1, 2, 3, 4, 5];
      const steps = linkedListCycleDetectionDefinition.generate(input) as NodesArrowsStep[];
      const collisionStep = steps.find(s => s.vars?.hasCycle === true);
      expect(collisionStep).toBeDefined();
      expect(collisionStep?.vars?.status).toBe('Cycle Confirmed');
    });

    it('detects no cycle when list terminates at null', () => {
      const input = [10, 20, 30, 40];
      const steps = linkedListCycleDetectionDefinition.generate(input) as NodesArrowsStep[];
      const noCycleStep = steps.find(s => s.vars?.status === 'No Cycle');
      expect(noCycleStep).toBeDefined();
      expect(noCycleStep?.vars?.hasCycle).toBe(false);
    });
  });

  describe('Algorithm 3: Stack Push & Pop (LIFO)', () => {
    it('pushes 5 elements then pops 2 in strict LIFO order', () => {
      const input = [10, 20, 30, 40, 50];
      const steps = stackOperationsDefinition.generate(input) as NodesArrowsStep[];

      // Check pop step
      const popSteps = steps.filter(s => s.vars?.operation === 'Pop');
      expect(popSteps.length).toBe(2);
      expect(popSteps[0].vars?.popped).toBe(50);
      expect(popSteps[1].vars?.popped).toBe(40);

      // Final stack top should be 30 and size 3
      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.size).toBe(3);
      expect(finalStep.vars?.top).toBe(30);
      expect(finalStep.nodesArrows.nodes.length).toBe(3);
    });

    it('handles single element push and pop', () => {
      const steps = stackOperationsDefinition.generate([42]) as NodesArrowsStep[];
      expect(steps.length).toBeGreaterThan(0);
    });
  });

  describe('Algorithm 4: Queue Enqueue & Dequeue (FIFO)', () => {
    it('enqueues 5 elements then dequeues 2 in strict FIFO order', () => {
      const input = [10, 20, 30, 40, 50];
      const steps = queueOperationsDefinition.generate(input) as NodesArrowsStep[];

      // Check dequeue steps
      const dequeueSteps = steps.filter(s => s.vars?.operation === 'Dequeue');
      expect(dequeueSteps.length).toBe(2);
      expect(dequeueSteps[0].vars?.dequeued).toBe(10);
      expect(dequeueSteps[1].vars?.dequeued).toBe(20);

      // Final queue front should be 30, rear should be 50, size 3
      const finalStep = steps[steps.length - 1];
      expect(finalStep.vars?.size).toBe(3);
      expect(finalStep.vars?.front).toBe(30);
      expect(finalStep.vars?.rear).toBe(50);
      expect(finalStep.nodesArrows.nodes.length).toBe(3);
    });
  });

  describe('Algorithm 5: Hash Table (Separate Chaining)', () => {
    it('resolves collisions into linked list chains at corresponding bucket index', () => {
      const input = [12, 17, 22, 5, 8];
      const steps = hashTableChainingDefinition.generate(input) as NodesArrowsStep[];

      const finalStep = steps[steps.length - 1];
      const buckets = finalStep.nodesArrows.buckets;
      expect(buckets).toBeDefined();
      expect(buckets?.length).toBe(5);

      // Bucket 2 should have 3 collisions: 12, 17, 22 (all % 5 === 2)
      const bucket2 = buckets?.find((b: HashBucket) => b.index === 2);
      expect(bucket2).toBeDefined();
      expect(bucket2?.nodeIds.length).toBe(3);

      // Bucket 0 should have 1 key: 5 (5 % 5 === 0)
      const bucket0 = buckets?.find((b: HashBucket) => b.index === 0);
      expect(bucket0?.nodeIds.length).toBe(1);

      // Bucket 3 should have 1 key: 8 (8 % 5 === 3)
      const bucket3 = buckets?.find((b: HashBucket) => b.index === 3);
      expect(bucket3?.nodeIds.length).toBe(1);
    });
  });

  describe('Algorithm 6: LRU Cache (Doubly Linked + Map)', () => {
    it('evicts least recently used items and promotes hits to MRU head', () => {
      // Sequence: 1, 2, 3 (fills capacity 3)
      // 4: evicts 1 -> [4, 3, 2]
      // 2: hit -> [2, 4, 3]
      // 5: evicts 3 -> [5, 2, 4]
      const input = [1, 2, 3, 4, 2, 5];
      const steps = lruCacheDefinition.generate(input) as NodesArrowsStep[];

      // Verify eviction occurred for key 1
      const evict1Step = steps.find(s => s.vars?.action === 'Evicting LRU' && s.vars?.evictedKey === 1);
      expect(evict1Step).toBeDefined();

      // Verify cache hit occurred for key 2
      const hit2Step = steps.find(s => s.vars?.action === 'Cache Hit' && s.vars?.key === 2);
      expect(hit2Step).toBeDefined();

      // Final step verification: cacheList must be ['5', '2', '4']
      const finalStep = steps[steps.length - 1];
      expect(finalStep.nodesArrows.cacheList).toEqual(['5', '2', '4']);
      expect(finalStep.vars?.mru).toBe(5);
      expect(finalStep.vars?.lru).toBe(4);
      expect(finalStep.vars?.finalSize).toBe(3);
    });
  });
});

