/**
 * Kruskal's Minimum Spanning Tree - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const kruskalMstDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'kruskal-mst',
  name: "Kruskal's Minimum Spanning Tree",
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O(E log E)',
    average: 'O(E log E)',
    worst: 'O(E log E)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Constructs a Minimum Spanning Tree by sorting all edges by weight and greedily adding edges that connect previously disjoint components using Disjoint-Set Union (Union-Find).',
  pseudocode: [
    'procedure Kruskal(G):',
    '  A := empty set',
    '  for each vertex v in G do MakeSet(v)',
    '  sort edges of G by weight in non-decreasing order',
    '  for each edge (u, v, w) in sorted edges do:',
    '    if Find(u) != Find(v) then:',
    '      A := A union {(u, v)}',
    '      Union(u, v)',
    '  return A',
  ],
  presets: [
    {
      name: 'five-node-mst',
      label: '5-Node Weighted Network',
      description: 'Greedily avoids cycles to find the lowest-cost spanning tree.',
      input: {
        nodes: ['A', 'B', 'C', 'D', 'E'],
        edges: [
          { source: 'A', target: 'B', weight: 1 },
          { source: 'B', target: 'C', weight: 2 },
          { source: 'A', target: 'C', weight: 4 },
          { source: 'C', target: 'D', weight: 3 },
          { source: 'D', target: 'E', weight: 5 },
          { source: 'C', target: 'E', weight: 6 },
        ],
      },
    },
    {
      name: 'six-node-graph',
      label: '6-Node Graph with Redundant Chords',
      description: 'Rejects multiple heavier chords that would form cycles.',
      input: {
        nodes: ['1', '2', '3', '4', '5', '6'],
        edges: [
          { source: '1', target: '2', weight: 4 },
          { source: '1', target: '3', weight: 2 },
          { source: '2', target: '3', weight: 1 },
          { source: '2', target: '4', weight: 5 },
          { source: '3', target: '5', weight: 10 },
          { source: '4', target: '5', weight: 2 },
          { source: '4', target: '6', weight: 6 },
          { source: '5', target: '6', weight: 3 },
        ],
      },
    },
  ],
  generate(input: GraphDataInput): GraphStep[] {
    const rawNodes = input.nodes?.length ? input.nodes : ['A', 'B', 'C', 'D', 'E'];
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

    const steps: GraphStep[] = [];
    const getEdgeKey = (u: string, v: string) => (u < v ? `${u}-${v}` : `${v}-${u}`);

    // DSU (Union-Find)
    const parent: Record<string, string> = {};
    for (const n of rawNodes) parent[n] = n;

    const find = (i: string): string => {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    };

    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    };

    // Sort edges by weight
    const sortedEdges = [...rawEdges].sort((a, b) => {
      const wa = typeof a.weight === 'number' ? a.weight : Number(a.weight) || 1;
      const wb = typeof b.weight === 'number' ? b.weight : Number(b.weight) || 1;
      return wa - wb;
    });

    const mstEdges = new Set<string>();
    const rejectedEdges = new Set<string>();
    let totalMstWeight = 0;

    const record = (
      caption: string,
      line: number,
      activeEdge?: [string, string],
      vars?: Record<string, string | number | boolean>,
      isFinal?: boolean
    ) => {
      const nodes: GraphNode[] = rawNodes.map(id => ({
        id,
        label: id,
        x: nodeCoords[id].x,
        y: nodeCoords[id].y,
        mark: isFinal ? 'path' : mstEdges.size > 0 && Object.keys(parent).some(k => find(k) === find(id) && k !== id) ? 'visited' : 'unvisited',
      }));

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
        } else if (rejectedEdges.has(key)) {
          mark = 'cross';
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
          visitedOrder: Array.from(mstEdges),
        },
      });
    };

    record(
      `Initialize Kruskal: sort ${sortedEdges.length} edges in non-decreasing order of weight. Make-Set on all ${V} vertices.`,
      4,
      undefined,
      {
        numVertices: V,
        numEdges: sortedEdges.length,
        sortedEdges: sortedEdges.map(e => `(${e.source}-${e.target}:${e.weight})`).join(', '),
      }
    );

    for (const e of sortedEdges) {
      const u = e.source;
      const v = e.target;
      const w = typeof e.weight === 'number' ? e.weight : Number(e.weight) || 1;
      const key = getEdgeKey(u, v);

      const rootU = find(u);
      const rootV = find(v);

      record(
        `Inspect cheapest remaining edge (${u}, ${v}) with weight ${w}. Find(${u}) = '${rootU}', Find(${v}) = '${rootV}'.`,
        5,
        [u, v],
        { u, v, weight: w, component_u: rootU, component_v: rootV }
      );

      if (rootU !== rootV) {
        union(u, v);
        mstEdges.add(key);
        totalMstWeight += w;

        record(
          `Components differ ('${rootU}' ≠ '${rootV}'). Add edge (${u}, ${v}) to MST! Running MST weight = ${totalMstWeight}.`,
          7,
          [u, v],
          {
            acceptedEdge: `(${u}, ${v})`,
            weight: w,
            totalMstWeight,
            mstEdgeCount: `${mstEdges.size} of ${V - 1}`,
          }
        );

        if (mstEdges.size === V - 1) {
          record(
            `MST now contains |V| - 1 = ${V - 1} edges. Spanning tree is fully connected!`,
            8,
            undefined,
            { totalMstWeight, edges: Array.from(mstEdges).join(', ') }
          );
          break;
        }
      } else {
        rejectedEdges.add(key);
        record(
          `Both vertices belong to component '${rootU}'. Adding edge (${u}, ${v}) would create a cycle! Reject edge.`,
          5,
          [u, v],
          { rejectedEdge: `(${u}, ${v})`, cyclePrevented: true }
        );
      }
    }

    record(
      `Kruskal's MST complete! Total weight of minimum spanning tree is ${totalMstWeight}. Selected edges: [${Array.from(mstEdges).join(', ')}].`,
      9,
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

export default kruskalMstDefinition;

