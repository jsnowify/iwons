/**
 * Bellman-Ford Algorithm - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const bellmanFordDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'bellman-ford',
  name: 'Bellman-Ford Algorithm',
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O(E)',
    average: 'O(V · E)',
    worst: 'O(V · E)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Computes single-source shortest paths on graphs supporting negative edge weights by relaxing all edges |V| - 1 times, and detects reachable negative-weight cycles.',
  pseudocode: [
    'procedure BellmanFord(G, start):',
    '  dist[v] := infinity for all v in G; dist[start] := 0',
    '  for i := 1 to |V| - 1 do:',
    '    for each edge (u, v, w) in G do:',
    '      if dist[u] + w < dist[v] then:',
    '        dist[v] := dist[u] + w; prev[v] := u',
    '  // Negative cycle check',
    '  for each edge (u, v, w) in G do:',
    '    if dist[u] + w < dist[v] return "Negative cycle detected"',
    '  return dist',
  ],
  presets: [
    {
      name: 'negative-weights-valid',
      label: 'Negative Weights (No Negative Cycle)',
      description: 'Edge weights with -2 and -3 correctly handled.',
      input: {
        nodes: ['A', 'B', 'C', 'D', 'E'],
        edges: [
          { source: 'A', target: 'B', weight: 4 },
          { source: 'A', target: 'C', weight: 2 },
          { source: 'B', target: 'C', weight: -1 },
          { source: 'B', target: 'D', weight: 2 },
          { source: 'C', target: 'E', weight: 3 },
          { source: 'E', target: 'D', weight: -3 },
        ],
        startNode: 'A',
        directed: true,
      },
    },
    {
      name: 'negative-cycle-demo',
      label: 'Negative Cycle Detection',
      description: 'Cycle B -> C -> D -> B with sum -2 causes endless reduction.',
      input: {
        nodes: ['A', 'B', 'C', 'D'],
        edges: [
          { source: 'A', target: 'B', weight: 1 },
          { source: 'B', target: 'C', weight: 2 },
          { source: 'C', target: 'D', weight: -5 },
          { source: 'D', target: 'B', weight: 1 },
        ],
        startNode: 'A',
        directed: true,
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

    const steps: GraphStep[] = [];
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const treeEdges = new Set<string>();

    const getEdgeKey = (u: string, v: string) => (input.directed ? `${u}->${v}` : u < v ? `${u}-${v}` : `${v}-${u}`);

    for (const n of rawNodes) {
      dist[n] = Infinity;
      prev[n] = null;
    }
    dist[startNode] = 0;

    const record = (
      caption: string,
      line: number,
      activeEdge?: [string, string],
      vars?: Record<string, string | number | boolean>,
      isNegativeCycle?: boolean
    ) => {
      const nodes: GraphNode[] = rawNodes.map(id => {
        let mark: GraphNode['mark'] = 'unvisited';
        if (id === startNode) mark = 'current';
        else if (dist[id] !== Infinity) mark = 'visited';

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
        if (
          activeEdge &&
          ((e.source === activeEdge[0] && e.target === activeEdge[1]) ||
            (!input.directed && e.source === activeEdge[1] && e.target === activeEdge[0]))
        ) {
          mark = isNegativeCycle ? 'back' : 'active';
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
          visitedOrder: Object.keys(dist).filter(k => dist[k] !== Infinity),
        },
      });
    };

    record(
      `Initialize Bellman-Ford: dist[${startNode}] = 0, all other distances = ∞. Will perform up to ${V - 1} relaxation passes.`,
      2,
      undefined,
      { start: startNode, numVertices: V, maxPasses: V - 1 }
    );

    // V - 1 relaxation rounds
    for (let round = 1; round <= V - 1; round++) {
      let anyRelaxed = false;

      record(`Begin relaxation pass ${round} of ${V - 1}.`, 3, undefined, { pass: round });

      for (const e of rawEdges) {
        const u = e.source;
        const v = e.target;
        const w = typeof e.weight === 'number' ? e.weight : Number(e.weight) || 1;

        if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
          const oldDist = dist[v];
          dist[v] = dist[u] + w;
          prev[v] = u;
          treeEdges.add(getEdgeKey(u, v));
          anyRelaxed = true;

          record(
            `Pass ${round}: Relax edge (${u} → ${v}, weight ${w}). dist[${v}] reduced from ${oldDist === Infinity ? '∞' : oldDist} to ${dist[v]}.`,
            6,
            [u, v],
            { pass: round, u, v, weight: w, oldDist: oldDist === Infinity ? '∞' : oldDist, newDist: dist[v] }
          );
        }
      }

      if (!anyRelaxed) {
        record(
          `Pass ${round}: No distances updated. Graph has converged early in ${round} passes.`,
          3,
          undefined,
          { convergedEarly: true, totalPasses: round }
        );
        break;
      }
    }

    // Negative cycle detection pass
    let hasNegativeCycle = false;
    for (const e of rawEdges) {
      const u = e.source;
      const v = e.target;
      const w = typeof e.weight === 'number' ? e.weight : Number(e.weight) || 1;

      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        hasNegativeCycle = true;
        record(
          `Negative cycle detected! Edge (${u} → ${v}, weight ${w}) can still be relaxed (dist[${u}]+${w} = ${dist[u] + w} < dist[${v}] = ${dist[v]}).`,
          9,
          [u, v],
          { negativeCycle: true, edge: `(${u}, ${v})`, result: 'Negative Cycle Detected' },
          true
        );
        return steps;
      }
    }

    record(
      `Bellman-Ford complete. No negative cycles found. Final shortest distances from ${startNode}: ${Object.entries(dist).map(([k, d]) => `${k}:${d}`).join(', ')}.`,
      10,
      undefined,
      {
        startNode,
        distances: Object.entries(dist).map(([k, d]) => `${k}:${d}`).join(', '),
        result: 'Complete',
      }
    );

    return steps;
  },
};

export default bellmanFordDefinition;
