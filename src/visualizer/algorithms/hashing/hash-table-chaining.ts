/**
 * Hash Table with Separate Chaining - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, HashBucket, NodePointer } from '../../core/types';

export const hashTableChainingDefinition: AlgoDefinition<number[]> = {
  id: 'hash-table-chaining',
  name: 'Hash Table (Separate Chaining)',
  category: 'hashing',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Resolves hash key collisions by storing conflicting elements in linked lists attached to each bucket index. Demonstrates hash computation (key % 5) and collision chaining.',
  pseudocode: [
    'procedure insert(key):',
    '  bucket = hash(key)  // key mod 5',
    '  newNode = createNode(key)',
    '  if table[bucket] is empty then table[bucket] = newNode',
    '  else:',
    '    curr = table[bucket]',
    '    while curr.next is not null do curr = curr.next',
    '    curr.next = newNode  // append to collision chain',
  ],
  presets: [
    {
      name: 'collision-heavy',
      label: 'Collisions at Bucket 2 (12, 17, 22)',
      description: 'Keys 12, 17, and 22 all hash to bucket 2 (% 5), forming a 3-node collision chain.',
      input: [12, 17, 22, 5, 8],
    },
    {
      name: 'well-distributed',
      label: 'Uniform Spread (10, 21, 32, 43, 54)',
      description: 'Keys distribute evenly across buckets [0, 1, 2, 3, 4].',
      input: [10, 21, 32, 43, 54],
    },
    {
      name: 'single-element',
      label: 'Single Key (99)',
      description: 'Single key insertion into bucket 4 (99 % 5 = 4).',
      input: [99],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input !== undefined && input.length > 0 ? input.slice(0, 8) : [12, 17, 22, 5, 8];
    const steps: NodesArrowsStep[] = [];
    const BUCKET_COUNT = 5;

    // Bucket list tracking
    const bucketChains: { bucketIndex: number; nodeIds: string[] }[] = Array.from(
      { length: BUCKET_COUNT },
      (_, i) => ({ bucketIndex: i, nodeIds: [] })
    );

    const allNodes: LinkedNode[] = [];
    let nodeCounter = 0;

    const record = (
      caption: string,
      line: number,
      activeNodeId?: string,
      activeBucket?: number,
      vars?: Record<string, string | number | boolean>
    ) => {
      const styledNodes = allNodes.map(n => {
        let mark: LinkedNode['mark'] = undefined;
        if (n.id === activeNodeId) mark = 'active';

        return { ...n, mark };
      });

      const bucketsData: HashBucket[] = bucketChains.map(b => ({
        index: b.bucketIndex,
        nodeIds: [...b.nodeIds],
      }));

      const pointers: NodePointer[] = [];
      if (activeNodeId) {
        pointers.push({ name: 'key', nodeId: activeNodeId });
      }

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes: styledNodes,
          headId: allNodes[0]?.id ?? null,
          buckets: bucketsData,
          pointers,
        },
      });
    };

    record(
      `Initialized hash table with ${BUCKET_COUNT} empty buckets using hash(k) = k % ${BUCKET_COUNT}.`,
      1,
      undefined,
      undefined,
      { totalBuckets: BUCKET_COUNT, entries: 0 }
    );

    for (const key of raw) {
      const bucketIdx = ((key % BUCKET_COUNT) + BUCKET_COUNT) % BUCKET_COUNT;
      const chain = bucketChains[bucketIdx];
      const newNodeId = `hash_${nodeCounter++}_${key}`;

      const newNode: LinkedNode = {
        id: newNodeId,
        val: key,
        next: null,
        prev: null,
      };
      allNodes.push(newNode);

      record(
        `Compute hash for key ${key}: hash(${key}) = ${key} mod ${BUCKET_COUNT} = ${bucketIdx}.`,
        2,
        newNodeId,
        bucketIdx,
        { key, hash: bucketIdx, action: 'Hash Computed' }
      );

      if (chain.nodeIds.length === 0) {
        chain.nodeIds.push(newNodeId);
        record(
          `Bucket [${bucketIdx}] was empty. Inserted ${key} as head of bucket chain.`,
          4,
          newNodeId,
          bucketIdx,
          { bucket: bucketIdx, key, status: 'Direct Placement' }
        );
      } else {
        const lastNodeId = chain.nodeIds[chain.nodeIds.length - 1];
        const lastNode = allNodes.find(n => n.id === lastNodeId)!;
        lastNode.next = newNodeId;
        chain.nodeIds.push(newNodeId);

        record(
          `Collision at Bucket [${bucketIdx}]! Appended key ${key} to collision chain: ${lastNode.val} → ${key}.`,
          8,
          newNodeId,
          bucketIdx,
          {
            bucket: bucketIdx,
            key,
            collisionWith: lastNode.val,
            chainLength: chain.nodeIds.length,
            status: 'Collision Resolved',
          }
        );
      }
    }

    record(
      `All ${raw.length} keys inserted into hash table across ${BUCKET_COUNT} buckets.`,
      8,
      undefined,
      undefined,
      { totalKeys: raw.length, status: 'Done' }
    );

    return steps;
  },
};

export default hashTableChainingDefinition;

