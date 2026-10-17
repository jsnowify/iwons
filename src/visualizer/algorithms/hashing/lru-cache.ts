/**
 * LRU Cache (Doubly Linked List + Hash Map) - Engine 6 (Nodes & Arrows)
 */

import { AlgoDefinition, NodesArrowsStep, LinkedNode, NodePointer } from '../../core/types';

export const lruCacheDefinition: AlgoDefinition<number[]> = {
  id: 'lru-cache',
  name: 'LRU Cache (Doubly Linked + Map)',
  category: 'hashing',
  engine: 'nodes-arrows',
  complexity: {
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(1)',
    space: 'O(capacity)',
  },
  inputKind: 'numbers',
  blurb: 'Coordinates a Hash Map for O(1) key lookups and a Doubly Linked List for O(1) removal and re-insertion at the head. When cache capacity is exceeded, the least recently used tail node is evicted.',
  pseudocode: [
    'procedure put(key):',
    '  if key in map then',
    '    node = map[key]; moveToHead(node)  // mark as MRU',
    '  else',
    '    if size >= capacity then',
    '      lru = removeTail(); delete map[lru.key]  // evict LRU',
    '    newNode = createNode(key)',
    '    addToHead(newNode); map[key] = newNode',
  ],
  presets: [
    {
      name: 'eviction-walkthrough',
      label: 'Capacity 3 Eviction [1, 2, 3, 4, 2, 5]',
      description: 'Inserts 1, 2, 3, evicts 1 on inserting 4, re-accesses 2, and evicts 3 on inserting 5.',
      input: [1, 2, 3, 4, 2, 5],
    },
    {
      name: 'repeated-hits',
      label: 'Repeated Cache Hits [10, 20, 10, 30, 20]',
      description: 'Re-accessing keys 10 and 20 moves them to the MRU head position.',
      input: [10, 20, 10, 30, 20],
    },
    {
      name: 'single-element',
      label: 'Single Key (42)',
      description: 'Capacity 3 cache with single entry.',
      input: [42],
    },
  ],
  generate(input: number[]): NodesArrowsStep[] {
    const raw = input !== undefined && input.length > 0 ? input.slice(0, 8) : [1, 2, 3, 4, 2, 5];
    const CAPACITY = 3;
    const steps: NodesArrowsStep[] = [];

    interface DNode {
      id: string;
      key: number;
      prev?: DNode | null;
      next?: DNode | null;
    }

    const map = new Map<number, DNode>();
    const state = {
      head: null as DNode | null,
      tail: null as DNode | null,
    };
    let nodeCounter = 0;

    const getOrderedNodes = (): DNode[] => {
      const result: DNode[] = [];
      let curr = state.head;
      while (curr) {
        result.push(curr);
        curr = curr.next ?? null;
      }
      return result;
    };

    const record = (
      caption: string,
      line: number,
      activeId?: string,
      evictedId?: string,
      vars?: Record<string, string | number | boolean>
    ) => {
      const ordered = getOrderedNodes();

      const linkedNodes: LinkedNode[] = ordered.map((d, idx) => ({
        id: d.id,
        val: d.key,
        next: idx < ordered.length - 1 ? ordered[idx + 1].id : null,
        prev: idx > 0 ? ordered[idx - 1].id : null,
        mark: d.id === activeId ? 'active' : d.id === evictedId ? 'target' : undefined,
      }));

      const pointers: NodePointer[] = [];
      if (state.head) pointers.push({ name: 'MRU', nodeId: state.head.id });
      if (state.tail && state.tail.id !== state.head?.id) pointers.push({ name: 'LRU', nodeId: state.tail.id });

      const cacheList = ordered.map(d => String(d.key));

      steps.push({
        engine: 'nodes-arrows',
        caption,
        line,
        vars,
        nodesArrows: {
          nodes: linkedNodes,
          headId: state.head?.id ?? null,
          tailId: state.tail?.id ?? null,
          pointers,
          cacheList,
        },
      });
    };

    record(`Initialized empty LRU Cache with capacity = ${CAPACITY}.`, 1, undefined, undefined, {
      capacity: CAPACITY,
      size: 0,
    });

    const removeNode = (node: DNode) => {
      if (node.prev) node.prev.next = node.next;
      else state.head = node.next ?? null;

      if (node.next) node.next.prev = node.prev;
      else state.tail = node.prev ?? null;

      node.prev = null;
      node.next = null;
    };

    const addToHead = (node: DNode) => {
      node.next = state.head;
      node.prev = null;
      if (state.head) state.head.prev = node;
      state.head = node;
      if (!state.tail) state.tail = node;
    };

    for (const key of raw) {
      if (map.has(key)) {
        // Cache hit: Move to MRU head
        const existingNode = map.get(key)!;
        record(
          `Cache HIT for key ${key}! Moving node ${key} to MRU front of doubly linked list.`,
          3,
          existingNode.id,
          undefined,
          { action: 'Cache Hit', key, size: map.size }
        );

        removeNode(existingNode);
        addToHead(existingNode);

        record(
          `Key ${key} is now at the MRU head position.`,
          3,
          existingNode.id,
          undefined,
          { action: 'Moved to MRU', key, mru: state.head?.key ?? 'none', lru: state.tail?.key ?? 'none' }
        );
      } else {
        // Cache miss: Check eviction
        record(
          `Cache MISS for key ${key}. Checking capacity (current size = ${map.size}/${CAPACITY}).`,
          4,
          undefined,
          undefined,
          { action: 'Cache Miss', key, size: map.size, capacity: CAPACITY }
        );

        if (map.size >= CAPACITY && state.tail) {
          const lruNode = state.tail;
          record(
            `Capacity exceeded! Evicting LRU node ${lruNode.key} from the tail.`,
            6,
            undefined,
            lruNode.id,
            { action: 'Evicting LRU', evictedKey: lruNode.key }
          );

          removeNode(lruNode);
          map.delete(lruNode.key);
        }

        const newNode: DNode = {
          id: `lru_${nodeCounter++}_${key}`,
          key,
          prev: null,
          next: null,
        };

        addToHead(newNode);
        map.set(key, newNode);

        record(
          `Inserted new key ${key} at MRU head. Current cache: [${getOrderedNodes().map(n => n.key).join(' → ')}].`,
          8,
          newNode.id,
          undefined,
          {
            action: 'Inserted New Key',
            key,
            size: map.size,
            mru: state.head?.key ?? 'none',
            lru: state.tail?.key ?? 'none',
          }
        );
      }
    }

    record(
      `LRU Cache sequence complete. Most recently used: ${state.head?.key ?? 'none'}, Least recently used: ${state.tail?.key ?? 'none'}.`,
      8,
      state.head?.id,
      undefined,
      {
        finalSize: map.size,
        mru: state.head?.key ?? 'none',
        lru: state.tail?.key ?? 'none',
      }
    );

    return steps;
  },
};

export default lruCacheDefinition;

