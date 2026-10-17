/**
 * Topological Sort (Kahn's) - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const topologicalSortKahnsDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'topological-sort-kahns',
  name: "Topological Sort (Kahn's)",
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Produces a linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u → v, vertex u comes before v, using vertex in-degrees and a queue of zero-indegree candidates.',
  pseudocode: [
    'procedure KahnTopologicalSort(DAG):',
    '  compute inDegree for all vertices',
    '  Q := queue containing all vertices with inDegree = 0',
    '  topologicalOrder := empty list',
    '  while Q is not empty do:',
    '    u := Q.dequeue()',
    '    topologicalOrder.append(u)',
    '    for each outgoing edge (u → v) do:',
    '      inDegree[v] := inDegree[v] - 1',
    '      if inDegree[v] = 0 then Q.enqueue(v)',
    '  if length(topologicalOrder) = |V| return topologicalOrder',
    '  else return "Cycle detected (not a DAG)"',
  ],
  presets: [
    {
      name: 'dag-build-pipeline',
      label: 'Build Pipeline (6 Tasks)',
      description: 'Dependencies: Lint & Test -> Build -> Package -> Deploy.',
      input: {
        nodes: ['Code', 'Lint', 'Test', 'Build', 'Package', 'Deploy'],
        edges: [
          { source: 'Code', target: 'Lint' },
          { source: 'Code', target: 'Test' },
          { source: 'Lint', target: 'Build' },
          { source: 'Test', target: 'Build' },
          { source: 'Build', target: 'Package' },
          { source: 'Package', target: 'Deploy' },
        ],
        directed: true,
      },
    },
    {
      name: 'course-prerequisites',
      label: 'Course Prerequisites (5 Courses)',
      description: 'CS101, CS102, CS201, CS301, CS401 with branching requirements.',
      input: {
        nodes: ['CS101', 'CS102', 'CS201', 'CS301', 'CS401'],
        edges: [
          { source: 'CS101', target: 'CS102' },
          { source: 'CS101', target: 'CS201' },
          { source: 'CS102', target: 'CS301' },
          { source: 'CS201', target: 'CS301' },
          { source: 'CS301', target: 'CS401' },
        ],
        directed: true,
      },
    },
    {
      name: 'cycle-rejection',
      label: 'Cyclic Graph (Dependency Loop)',
      description: 'Mutual dependency A → B → C → A halts queue early.',
      input: {
        nodes: ['A', 'B', 'C', 'D'],
        edges: [
          { source: 'A', target: 'B' },
          { source: 'B', target: 'C' },
          { source: 'C', target: 'A' },
          { source: 'D', target: 'A' },
        ],
        directed: true,
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

    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    for (const n of rawNodes) {
      inDegree[n] = 0;
      adj[n] = [];
    }

    for (const e of rawEdges) {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    }

    const steps: GraphStep[] = [];
    const queue: string[] = [];
    const topOrder: string[] = [];
    const processedEdges = new Set<string>();

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
        if (isFinal && topOrder.length === V) {
          mark = 'path';
        } else if (id === currentNode) {
          mark = 'current';
        } else if (topOrder.includes(id)) {
          mark = 'finished';
        } else if (queue.includes(id)) {
          mark = 'frontier';
        }

        return {
          id,
          label: id,
          x: nodeCoords[id].x,
          y: nodeCoords[id].y,
          mark,
          distance: `deg:${inDegree[id]}`,
        };
      });

      const edges: GraphEdge[] = rawEdges.map(e => {
        const key = `${e.source}->${e.target}`;
        let mark: GraphEdge['mark'] = undefined;
        if (
          activeEdge &&
          e.source === activeEdge[0] &&
          e.target === activeEdge[1]
        ) {
          mark = 'active';
        } else if (processedEdges.has(key)) {
          mark = 'tree';
        }

        return {
          source: e.source,
          target: e.target,
          weight: e.weight,
          mark,
          directed: true,
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
          visitedOrder: [...topOrder],
        },
      });
    };

    record(
      `Compute in-degrees for all vertices: ${Object.entries(inDegree).map(([k, d]) => `${k}:${d}`).join(', ')}.`,
      2,
      undefined,
      undefined,
      { inDegrees: Object.entries(inDegree).map(([k, d]) => `${k}:${d}`).join(', ') }
    );

    // Enqueue all in-degree 0 nodes
    for (const n of rawNodes) {
      if (inDegree[n] === 0) queue.push(n);
    }

    record(
      `Enqueue all candidate vertices with in-degree 0: [${queue.join(', ')}].`,
      3,
      undefined,
      undefined,
      { zeroInDegreeQueue: queue.join(', ') }
    );

    while (queue.length > 0) {
      const u = queue.shift()!;
      topOrder.push(u);

      record(
        `Dequeue ${u} (in-degree 0). Append to topological sort order.`,
        6,
        u,
        undefined,
        { current: u, order: topOrder.join(' → '), queue: queue.join(', ') || 'empty' }
      );

      for (const v of adj[u] || []) {
        inDegree[v]--;
        processedEdges.add(`${u}->${v}`);

        record(
          `Remove edge ${u} → ${v}: decrement in-degree of ${v} to ${inDegree[v]}.`,
          9,
          u,
          [u, v],
          { u, v, newInDegree_v: inDegree[v] }
        );

        if (inDegree[v] === 0) {
          queue.push(v);
          record(
            `Vertex ${v} now has in-degree 0! Enqueue ${v} as candidate.`,
            10,
            v,
            [u, v],
            { ready: v, queue: queue.join(', ') }
          );
        }
      }
    }

    const isDAG = topOrder.length === V;

    record(
      isDAG
        ? `Topological Sort successful! Valid DAG ordering: ${topOrder.join(' → ')}.`
        : `Cycle detected in graph! Only ${topOrder.length} of ${V} vertices ordered. Graph is not a DAG.`,
      isDAG ? 11 : 12,
      undefined,
      undefined,
      {
        isDAG,
        orderedCount: `${topOrder.length} of ${V}`,
        topologicalOrder: isDAG ? topOrder.join(' → ') : 'Cycle detected',
        result: isDAG ? topOrder.join(' → ') : 'Cycle Detected',
      },
      isDAG
    );

    return steps;
  },
};

export default topologicalSortKahnsDefinition;

