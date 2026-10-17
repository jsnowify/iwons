/**
 * Dijkstra's Shortest Path - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const dijkstraDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'dijkstra',
  name: "Dijkstra's Shortest Path",
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O((V + E) log V)',
    average: 'O((V + E) log V)',
    worst: 'O((V + E) log V)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Finds the single-source shortest path from a start vertex to all other vertices in a weighted graph with non-negative edge weights using a greedy priority queue.',
  pseudocode: [
    'procedure Dijkstra(G, start, target):',
    '  dist[v] := infinity for all v in G; dist[start] := 0',
    '  PQ.insert(start, 0)',
    '  while PQ is not empty do:',
    '    u := PQ.extractMin()',
    '    for each neighbour v of u with edge weight w do:',
    '      if dist[u] + w < dist[v] then:',
    '        dist[v] := dist[u] + w',
    '        prev[v] := u; PQ.insert(v, dist[v])',
    '  return reconstructPath(prev, start, target)',
  ],
  presets: [
    {
      name: 'five-node-weighted',
      label: '5-Node Weighted Network (A -> E)',
      description: 'Multiple alternative routes with differing edge weights.',
      input: {
        nodes: ['A', 'B', 'C', 'D', 'E'],
        edges: [
          { source: 'A', target: 'B', weight: 4 },
          { source: 'A', target: 'C', weight: 2 },
          { source: 'B', target: 'C', weight: 1 },
          { source: 'B', target: 'D', weight: 5 },
          { source: 'C', target: 'D', weight: 8 },
          { source: 'C', target: 'E', weight: 10 },
          { source: 'D', target: 'E', weight: 2 },
        ],
        startNode: 'A',
        targetNode: 'E',
      },
    },
    {
      name: 'six-node-mesh',
      label: '6-Node Mesh (S -> T)',
      description: 'Grid-like connections demonstrating greedy relaxation.',
      input: {
        nodes: ['S', 'A', 'B', 'C', 'D', 'T'],
        edges: [
          { source: 'S', target: 'A', weight: 3 },
          { source: 'S', target: 'B', weight: 5 },
          { source: 'A', target: 'C', weight: 3 },
          { source: 'B', target: 'C', weight: 2 },
          { source: 'B', target: 'D', weight: 6 },
          { source: 'C', target: 'T', weight: 4 },
          { source: 'D', target: 'T', weight: 1 },
        ],
        startNode: 'S',
        targetNode: 'T',
      },
    },
  ],
  generate(input: GraphDataInput): GraphStep[] {
    const rawNodes = input.nodes?.length ? input.nodes : ['A', 'B', 'C', 'D', 'E'];
    const startNode = input.startNode && rawNodes.includes(input.startNode) ? input.startNode : rawNodes[0];
    const targetNode = input.targetNode && rawNodes.includes(input.targetNode) ? input.targetNode : rawNodes[rawNodes.length - 1];
    const rawEdges = input.edges ?? [];

    // Adjacency with weights
    const adj: Record<string, { to: string; weight: number }[]> = {};
    for (const n of rawNodes) adj[n] = [];
    for (const e of rawEdges) {
      const w = typeof e.weight === 'number' ? e.weight : Number(e.weight) || 1;
      adj[e.source]?.push({ to: e.target, weight: w });
      if (!input.directed) {
        adj[e.target]?.push({ to: e.source, weight: w });
      }
    }

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
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const settled = new Set<string>();
    const pq: { node: string; d: number }[] = [];
    const inPathEdges = new Set<string>();
    const treeEdges = new Set<string>();

    const getEdgeKey = (u: string, v: string) => (u < v ? `${u}-${v}` : `${v}-${u}`);

    for (const n of rawNodes) {
      dist[n] = Infinity;
      prev[n] = null;
    }
    dist[startNode] = 0;
    pq.push({ node: startNode, d: 0 });

    const record = (
      caption: string,
      line: number,
      currentNode?: string,
      activeEdge?: [string, string],
      vars?: Record<string, string | number | boolean>,
      isFinal?: boolean
    ) => {
      const nodes: GraphNode[] = rawNodes.map(id => {
        let mark: GraphNode['mark'] = 'unvisited';
        if (isFinal && (id === startNode || id === targetNode || Object.values(prev).includes(id))) {
          mark = 'path';
        } else if (id === currentNode) {
          mark = 'current';
        } else if (settled.has(id)) {
          mark = 'visited';
        } else if (pq.some(item => item.node === id)) {
          mark = 'frontier';
        }

        return {
          id,
          label: id,
          x: nodeCoords[id].x,
          y: nodeCoords[id].y,
          mark,
          distance: dist[id] === Infinity ? 'd=∞' : `d=${dist[id]}`,
        };
      });

      const edges: GraphEdge[] = rawEdges.map(e => {
        const edgeKey = getEdgeKey(e.source, e.target);
        let mark: GraphEdge['mark'] = undefined;
        if (inPathEdges.has(edgeKey)) {
          mark = 'in-path';
        } else if (
          activeEdge &&
          ((e.source === activeEdge[0] && e.target === activeEdge[1]) ||
            (e.source === activeEdge[1] && e.target === activeEdge[0]))
        ) {
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
          queueOrStack: {
            type: 'priority-queue',
            items: pq.map(item => `${item.node}(${item.d})`),
          },
          visitedOrder: Array.from(settled),
        },
      });
    };

    record(
      `Initialize Dijkstra: set dist[${startNode}] = 0, all other distances = ∞. Insert ${startNode} into Priority Queue.`,
      2,
      startNode,
      undefined,
      { start: startNode, target: targetNode }
    );

    while (pq.length > 0) {
      // Extract node with minimum distance
      pq.sort((a, b) => a.d - b.d);
      const { node: u, d: curD } = pq.shift()!;

      if (settled.has(u)) continue;
      settled.add(u);

      record(
        `Extract vertex ${u} with minimum distance ${curD} from Priority Queue. Vertex ${u} is now finalized.`,
        5,
        u,
        undefined,
        { current: u, distance: curD, settled: Array.from(settled).join(', ') }
      );

      if (u === targetNode) {
        record(`Target vertex ${targetNode} reached with minimal distance ${dist[targetNode]}!`, 5, u);
        break;
      }

      const neighbors = adj[u] || [];
      for (const { to: v, weight: w } of neighbors) {
        const edgeKey = getEdgeKey(u, v);
        record(`Inspect outgoing edge (${u}, ${v}) with weight ${w}.`, 6, u, [u, v], {
          u,
          v,
          weight: w,
          currentDist_v: dist[v] === Infinity ? '∞' : dist[v],
        });

        if (!settled.has(v) && curD + w < dist[v]) {
          const oldDist = dist[v];
          dist[v] = curD + w;
          prev[v] = u;
          treeEdges.add(edgeKey);
          pq.push({ node: v, d: dist[v] });

          record(
            `Relax edge (${u}, ${v}): dist[${v}] updated from ${oldDist === Infinity ? '∞' : oldDist} to ${dist[v]} (via ${u}).`,
            8,
            u,
            [u, v],
            { u, v, oldDist: oldDist === Infinity ? '∞' : oldDist, newDist: dist[v] }
          );
        }
      }
    }

    // Reconstruct shortest path
    const pathNodes: string[] = [];
    let curr: string | null = targetNode;
    while (curr) {
      pathNodes.push(curr);
      curr = prev[curr];
    }
    pathNodes.reverse();

    if (pathNodes[0] === startNode) {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        inPathEdges.add(getEdgeKey(pathNodes[i], pathNodes[i + 1]));
      }
    }

    const finalDistance = dist[targetNode];

    record(
      finalDistance !== Infinity
        ? `Shortest path from ${startNode} to ${targetNode} found! Total distance = ${finalDistance}. Path: ${pathNodes.join(' → ')}.`
        : `No path exists from ${startNode} to ${targetNode}.`,
      10,
      targetNode,
      undefined,
      {
        start: startNode,
        target: targetNode,
        distance: finalDistance,
        path: pathNodes.join(' → '),
        result: finalDistance,
      },
      true
    );

    return steps;
  },
};

export default dijkstraDefinition;

