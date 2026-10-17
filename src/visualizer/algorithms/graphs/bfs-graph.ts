/**
 * Breadth-First Search (BFS) - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const bfsGraphDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'bfs-graph',
  name: 'Breadth-First Search (BFS)',
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Explores vertices layer-by-layer starting from a root node. Uses a FIFO queue to discover all immediate neighbours before venturing deeper, finding shortest paths on unweighted graphs.',
  pseudocode: [
    'procedure BFS(G, start_v):',
    '  let Q be a queue',
    '  mark start_v as visited',
    '  Q.enqueue(start_v)',
    '  while Q is not empty do:',
    '    v := Q.dequeue()',
    '    for all edges from v to w in G.adjacentEdges(v) do:',
    '      if w is not visited then:',
    '        mark w as visited',
    '        Q.enqueue(w)',
  ],
  presets: [
    {
      name: 'simple-6-nodes',
      label: 'Connected 6-Node Graph',
      description: 'Standard connected graph showing branching wave.',
      input: {
        nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
        edges: [
          { source: 'A', target: 'B' },
          { source: 'A', target: 'C' },
          { source: 'B', target: 'D' },
          { source: 'B', target: 'E' },
          { source: 'C', target: 'F' },
          { source: 'D', target: 'E' },
        ],
        startNode: 'A',
      },
    },
    {
      name: 'bipartite-cycle',
      label: 'Cycle Graph with Cross Edges',
      description: 'Ring of 5 nodes with a cross-chord.',
      input: {
        nodes: ['1', '2', '3', '4', '5'],
        edges: [
          { source: '1', target: '2' },
          { source: '2', target: '3' },
          { source: '3', target: '4' },
          { source: '4', target: '5' },
          { source: '5', target: '1' },
          { source: '2', target: '5' },
        ],
        startNode: '1',
      },
    },
  ],
  generate(input: GraphDataInput): GraphStep[] {
    const rawNodes = input.nodes?.length ? input.nodes : ['A', 'B', 'C', 'D', 'E'];
    const startNode = input.startNode && rawNodes.includes(input.startNode) ? input.startNode : rawNodes[0];
    const rawEdges = input.edges ?? [];

    // Build adjacency list (undirected unless specified)
    const adj: Record<string, string[]> = {};
    for (const n of rawNodes) adj[n] = [];
    for (const e of rawEdges) {
      if (adj[e.source] && !adj[e.source].includes(e.target)) adj[e.source].push(e.target);
      if (!input.directed && adj[e.target] && !adj[e.target].includes(e.source)) adj[e.target].push(e.source);
    }
    // Sort adjacency lists for determinism
    for (const n of rawNodes) adj[n].sort();

    // Generate circular layout coordinates if not provided
    const nodeCoords: Record<string, { x: number; y: number }> = {};
    const count = rawNodes.length;
    const radius = 140;
    const centerX = 200;
    const centerY = 180;
    rawNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
      nodeCoords[node] = {
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
      };
    });

    const steps: GraphStep[] = [];
    const visited = new Set<string>();
    const distances: Record<string, number> = {};
    const queue: string[] = [];
    const visitedOrder: string[] = [];
    const treeEdges = new Set<string>();

    const getEdgeKey = (u: string, v: string) => (u < v ? `${u}-${v}` : `${v}-${u}`);

    const record = (
      caption: string,
      line: number,
      currentNode?: string,
      activeEdge?: [string, string],
      vars?: Record<string, string | number | boolean>
    ) => {
      const nodes: GraphNode[] = rawNodes.map(id => {
        let mark: GraphNode['mark'] = 'unvisited';
        if (id === currentNode) mark = 'current';
        else if (queue.includes(id)) mark = 'frontier';
        else if (visited.has(id)) mark = 'visited';

        return {
          id,
          label: id,
          x: nodeCoords[id].x,
          y: nodeCoords[id].y,
          mark,
          distance: distances[id] !== undefined ? `d=${distances[id]}` : undefined,
        };
      });

      const edges: GraphEdge[] = rawEdges.map(e => {
        const edgeKey = getEdgeKey(e.source, e.target);
        let mark: GraphEdge['mark'] = undefined;
        if (activeEdge && ((e.source === activeEdge[0] && e.target === activeEdge[1]) || (e.source === activeEdge[1] && e.target === activeEdge[0]))) {
          mark = 'active';
        } else if (treeEdges.has(edgeKey)) {
          mark = 'tree';
        }

        return {
          source: e.source,
          target: e.target,
          weight: e.weight,
          mark,
          directed: input.directed,
        };
      });

      steps.push({
        engine: 'graph',
        caption,
        line,
        vars,
        graph: {
          nodes,
          edges,
          queueOrStack: { type: 'queue', items: [...queue] },
          visitedOrder: [...visitedOrder],
        },
      });
    };

    record(`Initialize BFS queue with root node ${startNode}. Distance set to 0.`, 2, startNode);

    visited.add(startNode);
    distances[startNode] = 0;
    queue.push(startNode);
    visitedOrder.push(startNode);

    record(`Enqueue starting node ${startNode}. Mark as visited.`, 4, startNode, undefined, {
      queue: queue.join(', '),
      startNode,
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      record(`Dequeue node ${u} from the front of the queue to explore its neighbours.`, 6, u, undefined, {
        current: u,
        distance: distances[u],
        remainingQueue: queue.join(', ') || 'empty',
      });

      const neighbours = adj[u] || [];
      for (const v of neighbours) {
        const edgeKey = getEdgeKey(u, v);
        record(`Inspect edge (${u}, ${v}).`, 7, u, [u, v], { current: u, neighbour: v });

        if (!visited.has(v)) {
          visited.add(v);
          distances[v] = distances[u] + 1;
          queue.push(v);
          visitedOrder.push(v);
          treeEdges.add(edgeKey);

          record(
            `Node ${v} is undiscovered. Set distance = ${distances[v]} and enqueue ${v}.`,
            10,
            u,
            [u, v],
            { current: u, discovered: v, distance: distances[v], queue: queue.join(', ') }
          );
        } else {
          record(`Node ${v} has already been visited; skip edge (${u}, ${v}).`, 8, u, [u, v], {
            current: u,
            alreadyVisited: v,
          });
        }
      }
    }

    record(
      `BFS complete. Visited ${visited.size} vertices in total.`,
      10,
      undefined,
      undefined,
      { totalVisited: visited.size, order: visitedOrder.join(' → ') }
    );

    return steps;
  },
};

export default bfsGraphDefinition;

