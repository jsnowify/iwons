/**
 * Prim's Minimum Spanning Tree - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const primMstDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'prim-mst',
  name: "Prim's Minimum Spanning Tree",
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O((V + E) log V)',
    average: 'O((V + E) log V)',
    worst: 'O((V + E) log V)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Grows a Minimum Spanning Tree incrementally from an arbitrary starting vertex by repeatedly selecting the cheapest edge connecting a tree vertex to an unvisited vertex.',
  pseudocode: [
    'procedure Prim(G, start):',
    '  inMST := {start}',
    '  PQ := insert all edges incident to start',
    '  while |inMST| < |V| and PQ is not empty do:',
    '    (u, v, w) := PQ.extractMin()',
    '    if v not in inMST then:',
    '      inMST := inMST union {v}',
    '      add (u, v) to MST',
    '      PQ.insert all edges incident to v',
    '  return MST',
  ],
  presets: [
    {
      name: 'five-node-prim',
      label: '5-Node Weighted Network',
      description: 'Grows MST step by step from node A.',
      input: {
        nodes: ['A', 'B', 'C', 'D', 'E'],
        edges: [
          { source: 'A', target: 'B', weight: 2 },
          { source: 'A', target: 'C', weight: 3 },
          { source: 'B', target: 'C', weight: 1 },
          { source: 'B', target: 'D', weight: 4 },
          { source: 'C', target: 'E', weight: 5 },
          { source: 'D', target: 'E', weight: 1 },
        ],
        startNode: 'A',
      },
    },
    {
      name: 'six-node-prim',
      label: '6-Node Ring with Chords',
      description: 'Expands cut across multiple candidates.',
      input: {
        nodes: ['1', '2', '3', '4', '5', '6'],
        edges: [
          { source: '1', target: '2', weight: 3 },
          { source: '1', target: '3', weight: 1 },
          { source: '2', target: '4', weight: 2 },
          { source: '3', target: '4', weight: 4 },
          { source: '3', target: '5', weight: 6 },
          { source: '4', target: '6', weight: 5 },
          { source: '5', target: '6', weight: 2 },
        ],
        startNode: '1',
      },
    },
  ],
  generate(input: GraphDataInput): GraphStep[] {
    const rawNodes = input.nodes?.length ? input.nodes : ['A', 'B', 'C', 'D', 'E'];
    const startNode = input.startNode && rawNodes.includes(input.startNode) ? input.startNode : rawNodes[0];
    const rawEdges = input.edges ?? [];
    const V = rawNodes.length;

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

    const adj: Record<string, { to: string; weight: number }[]> = {};
    for (const n of rawNodes) adj[n] = [];
    for (const e of rawEdges) {
      const w = typeof e.weight === 'number' ? e.weight : Number(e.weight) || 1;
      adj[e.source]?.push({ to: e.target, weight: w });
      adj[e.target]?.push({ to: e.source, weight: w });
    }

    const steps: GraphStep[] = [];
    const getEdgeKey = (u: string, v: string) => (u < v ? `${u}-${v}` : `${v}-${u}`);

    const inMST = new Set<string>();
    const mstEdges = new Set<string>();
    let totalMstWeight = 0;

    // Priority queue of cut edges: { from, to, weight }
    const pq: { from: string; to: string; weight: number }[] = [];

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
        if (isFinal) {
          mark = 'path';
        } else if (id === currentNode) {
          mark = 'current';
        } else if (inMST.has(id)) {
          mark = 'visited';
        } else if (pq.some(e => e.to === id)) {
          mark = 'frontier';
        }

        return {
          id,
          label: id,
          x: nodeCoords[id].x,
          y: nodeCoords[id].y,
          mark,
        };
      });

      const edges: GraphEdge[] = rawEdges.map(e => {
        const key = getEdgeKey(e.source, e.target);
        let mark: GraphEdge['mark'] = undefined;
        if (isFinal && mstEdges.has(key)) {
          mark = 'in-path';
        } else if (mstEdges.has(key)) {
          mark = 'tree';
        } else if (
          activeEdge &&
          ((e.source === activeEdge[0] && e.target === activeEdge[1]) ||
            (e.source === activeEdge[1] && e.target === activeEdge[0]))
        ) {
          mark = 'active';
        } else if (pq.some(item => getEdgeKey(item.from, item.to) === key)) {
          mark = 'candidate';
        }

        return {
          source: e.source,
          target: e.target,
          weight: e.weight,
          mark,
          directed: false,
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
            items: pq.map(item => `(${item.from}-${item.to}:${item.weight})`),
          },
          visitedOrder: Array.from(inMST),
        },
      });
    };

    record(
      `Initialize Prim's algorithm from root vertex ${startNode}. Add ${startNode} to MST.`,
      2,
      startNode,
      undefined,
      { start: startNode }
    );

    inMST.add(startNode);
    for (const { to, weight } of adj[startNode] || []) {
      pq.push({ from: startNode, to, weight });
    }

    record(
      `Added all edges incident to ${startNode} to Priority Queue as candidate cut edges.`,
      3,
      startNode,
      undefined,
      {
        inMST: Array.from(inMST).join(', '),
        candidateEdges: pq.map(e => `(${e.from}-${e.to}:${e.weight})`).join(', '),
      }
    );

    while (inMST.size < V && pq.length > 0) {
      pq.sort((a, b) => a.weight - b.weight);
      const cheapest = pq.shift()!;
      const { from: u, to: v, weight: w } = cheapest;
      const key = getEdgeKey(u, v);

      record(
        `Extract cheapest cut edge (${u}, ${v}) with weight ${w} from Priority Queue.`,
        5,
        u,
        [u, v],
        { u, v, weight: w }
      );

      if (!inMST.has(v)) {
        inMST.add(v);
        mstEdges.add(key);
        totalMstWeight += w;

        for (const edge of adj[v] || []) {
          if (!inMST.has(edge.to)) {
            pq.push({ from: v, to: edge.to, weight: edge.weight });
          }
        }

        record(
          `Vertex ${v} is newly discovered. Add edge (${u}, ${v}) to MST! Running total weight = ${totalMstWeight}. Enqueue new cut edges from ${v}.`,
          8,
          v,
          [u, v],
          {
            addedVertex: v,
            edge: `(${u}, ${v})`,
            weight: w,
            totalMstWeight,
            inMST: Array.from(inMST).join(', '),
          }
        );
      } else {
        record(
          `Both endpoints ${u} and ${v} are already in MST. Discard edge (${u}, ${v}) to prevent cycles.`,
          6,
          u,
          [u, v],
          { discarded: `(${u}, ${v})`, cyclePrevented: true }
        );
      }
    }

    record(
      `Prim's MST complete! Spanning tree connects all ${inMST.size} vertices with total weight ${totalMstWeight}. Selected edges: [${Array.from(mstEdges).join(', ')}].`,
      10,
      undefined,
      undefined,
      {
        totalMstWeight,
        mstEdges: Array.from(mstEdges).join(', '),
        result: totalMstWeight,
      },
      true
    );

    return steps;
  },
};

export default primMstDefinition;
