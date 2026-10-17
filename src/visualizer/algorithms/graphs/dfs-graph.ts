/**
 * Depth-First Search (DFS) - Engine 4 (Graph)
 */

import { AlgoDefinition, GraphStep, GraphNode, GraphEdge } from '../../core/types';
import { GraphDataInput } from '../../core/inputs';

export const dfsGraphDefinition: AlgoDefinition<GraphDataInput> = {
  id: 'dfs-graph',
  name: 'Depth-First Search (DFS)',
  category: 'graphs',
  engine: 'graph',
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  inputKind: 'graph',
  blurb: 'Explores graph vertices by traversing as deeply as possible along each branch before backtracking, maintaining an explicit LIFO call stack and classifying tree vs back edges.',
  pseudocode: [
    'procedure DFS(G, start_v):',
    '  let S be a stack',
    '  S.push(start_v)',
    '  while S is not empty do:',
    '    v := S.pop()',
    '    if v is not visited then:',
    '      mark v as visited',
    '      for all edges from v to w in G.adjacentEdges(v) do:',
    '        if w is not visited then S.push(w)',
  ],
  presets: [
    {
      name: 'connected-tree-like',
      label: 'Connected 6-Node Graph',
      description: 'Branches deeply before backtracking through parent vertices.',
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
      name: 'cycle-graph',
      label: 'Cycle with Cross-Edges',
      description: 'Demonstrates back-edge discovery when a cycle is encountered.',
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

    const adj: Record<string, string[]> = {};
    for (const n of rawNodes) adj[n] = [];
    for (const e of rawEdges) {
      if (adj[e.source] && !adj[e.source].includes(e.target)) adj[e.source].push(e.target);
      if (!input.directed && adj[e.target] && !adj[e.target].includes(e.source)) adj[e.target].push(e.source);
    }
    // Reverse sort so standard push yields alphabetical exploration
    for (const n of rawNodes) adj[n].sort((a, b) => b.localeCompare(a));

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
    const stack: string[] = [];
    const visitedOrder: string[] = [];
    const treeEdges = new Set<string>();
    const backEdges = new Set<string>();

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
        else if (stack.includes(id)) mark = 'frontier';
        else if (visited.has(id)) mark = 'visited';

        return {
          id,
          label: id,
          x: nodeCoords[id].x,
          y: nodeCoords[id].y,
          mark,
        };
      });

      const edges: GraphEdge[] = rawEdges.map(e => {
        const edgeKey = getEdgeKey(e.source, e.target);
        let mark: GraphEdge['mark'] = undefined;
        if (
          activeEdge &&
          ((e.source === activeEdge[0] && e.target === activeEdge[1]) ||
            (e.source === activeEdge[1] && e.target === activeEdge[0]))
        ) {
          mark = 'active';
        } else if (treeEdges.has(edgeKey)) {
          mark = 'tree';
        } else if (backEdges.has(edgeKey)) {
          mark = 'back';
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
          queueOrStack: { type: 'stack', items: [...stack] },
          visitedOrder: [...visitedOrder],
        },
      });
    };

    record(`Initialize DFS stack with root vertex ${startNode}.`, 2, startNode);

    stack.push(startNode);
    record(`Push root vertex ${startNode} onto stack.`, 3, startNode, undefined, {
      stack: stack.join(', '),
    });

    while (stack.length > 0) {
      const u = stack.pop()!;

      if (!visited.has(u)) {
        visited.add(u);
        visitedOrder.push(u);

        record(`Pop ${u} from top of stack. Mark ${u} as visited.`, 6, u, undefined, {
          current: u,
          stack: stack.join(', ') || 'empty',
          order: visitedOrder.join(' → '),
        });

        const neighbours = adj[u] || [];
        for (const v of neighbours) {
          const edgeKey = getEdgeKey(u, v);
          if (!visited.has(v)) {
            stack.push(v);
            treeEdges.add(edgeKey);
            record(
              `Neighbour ${v} is unvisited. Push ${v} onto stack (tree edge (${u}, ${v})).`,
              8,
              u,
              [u, v],
              { current: u, neighbour: v, stack: stack.join(', ') }
            );
          } else {
            backEdges.add(edgeKey);
            record(`Neighbour ${v} is already visited. Edge (${u}, ${v}) is a cross/back edge.`, 7, u, [u, v], {
              current: u,
              alreadyVisited: v,
            });
          }
        }
      }
    }

    record(
      `DFS complete. Traversed ${visited.size} vertices: ${visitedOrder.join(' → ')}.`,
      9,
      undefined,
      undefined,
      { totalVisited: visited.size, order: visitedOrder.join(' → ') }
    );

    return steps;
  },
};

export default dfsGraphDefinition;

