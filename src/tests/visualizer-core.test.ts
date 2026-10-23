import { describe, it, expect } from 'vitest';
import {
  createInitialPlayerState,
  playerReducer,
  capFrames,
  DEFAULT_SPEED_MS,
} from '../visualizer/core/player';
import {
  parseNumberList,
  parseTargetAndNumbers,
  parsePatternMatch,
  parseGraphEdges,
  parseGridInput,
  generateRandomNumbers,
  generateSortedNumbers,
  generateReversedNumbers,
} from '../visualizer/core/inputs';
import {
  ALGORITHM_REGISTRY,
  getAlgorithmMetadata,
  getAlgorithmsByCategory,
  getAlgorithmsByEngine,
  loadAlgorithmDefinition,
} from '../visualizer/registry';
import { Step } from '../visualizer/core/types';
import bubbleSortDef from '../visualizer/algorithms/sorting/bubble-sort';
import binarySearchDef from '../visualizer/algorithms/searching/binary-search';
import fibonacciDpDef from '../visualizer/algorithms/dp/fibonacci-dp';
import bfsGraphDef from '../visualizer/algorithms/graphs/bfs-graph';
import binaryTreeInorderDef from '../visualizer/algorithms/trees/binary-tree-inorder';
import reverseLinkedListDef from '../visualizer/algorithms/linked-lists/reverse-linked-list';

describe('Visualizer Core: Player State Machine', () => {
  const dummySteps: Step[] = [
    { engine: 'bars', caption: 'Step 0', line: 1, bars: { values: [3, 2, 1] } },
    { engine: 'bars', caption: 'Step 1', line: 2, bars: { values: [2, 3, 1] } },
    { engine: 'bars', caption: 'Step 2', line: 3, bars: { values: [2, 1, 3] } },
    { engine: 'bars', caption: 'Step 3', line: 4, bars: { values: [1, 2, 3] } },
  ];

  it('initializes in idle state at frame 0 with valid configuration', () => {
    const player = createInitialPlayerState(dummySteps, { speedMs: 500, soundEnabled: true });
    expect(player.status).toBe('idle');
    expect(player.stepIndex).toBe(0);
    expect(player.totalFrames).toBe(4);
    expect(player.speedMs).toBe(500);
    expect(player.soundEnabled).toBe(true);
    expect(player.isCapped).toBe(false);
  });

  it('handles play, pause, togglePlay, stepForward and stepBack deterministically', () => {
    let state = createInitialPlayerState(dummySteps);
    expect(state.status).toBe('idle');

    state = playerReducer(state, { type: 'PLAY' });
    expect(state.status).toBe('playing');
    expect(state.stepIndex).toBe(0);

    state = playerReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stepIndex).toBe(1);
    expect(state.status).toBe('paused');

    state = playerReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stepIndex).toBe(2);

    state = playerReducer(state, { type: 'STEP_BACK' });
    expect(state.stepIndex).toBe(1);

    state = playerReducer(state, { type: 'STEP_BACK' });
    expect(state.stepIndex).toBe(0);

    // Abuse: stepBack at frame 0 stays at 0
    state = playerReducer(state, { type: 'STEP_BACK' });
    expect(state.stepIndex).toBe(0);

    // Advance to end
    state = playerReducer(state, { type: 'STEP_FORWARD' }); // 1
    state = playerReducer(state, { type: 'STEP_FORWARD' }); // 2
    state = playerReducer(state, { type: 'STEP_FORWARD' }); // 3 (last)
    expect(state.stepIndex).toBe(3);
    expect(state.status).toBe('completed');

    // Abuse: stepForward at last frame stays completed
    state = playerReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stepIndex).toBe(3);
    expect(state.status).toBe('completed');

    // Playing at last frame wraps around to beginning
    state = playerReducer(state, { type: 'PLAY' });
    expect(state.stepIndex).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('keeps autoplay running through consecutive ticks until the final frame', () => {
    let state = playerReducer(createInitialPlayerState(dummySteps), { type: 'PLAY' });

    for (let index = 1; index < dummySteps.length; index++) {
      state = playerReducer(state, { type: 'TICK' });
      expect(state.stepIndex).toBe(index);
      expect(state.status).toBe(index === dummySteps.length - 1 ? 'completed' : 'playing');
    }

    expect(playerReducer(state, { type: 'TICK' })).toBe(state);
    state = playerReducer(state, { type: 'PLAY' });
    expect(state.stepIndex).toBe(0);
    expect(playerReducer(state, { type: 'TICK' }).status).toBe('playing');
  });

  it('ignores ticks while idle or paused and resumes from the current frame', () => {
    let state = createInitialPlayerState(dummySteps);
    expect(playerReducer(state, { type: 'TICK' })).toBe(state);
    state = playerReducer(state, { type: 'PLAY' });
    state = playerReducer(state, { type: 'TICK' });
    state = playerReducer(state, { type: 'PAUSE' });
    expect(playerReducer(state, { type: 'TICK' })).toBe(state);
    expect(state.stepIndex).toBe(1);

    state = playerReducer(state, { type: 'PLAY' });
    state = playerReducer(state, { type: 'TICK' });
    expect(state.stepIndex).toBe(2);
    expect(state.status).toBe('playing');
  });

  it.each(['STEP_FORWARD', 'STEP_BACK'] as const)('pauses autoplay on manual %s', type => {
    let state = playerReducer(createInitialPlayerState(dummySteps), { type: 'PLAY' });
    state = playerReducer(state, { type: 'TICK' });
    state = playerReducer(state, { type });
    expect(state.stepIndex).toBe(type === 'STEP_FORWARD' ? 2 : 0);
    expect(state.status).toBe('paused');
    expect(playerReducer(state, { type: 'TICK' })).toBe(state);
  });

  it('scrubs to arbitrary index with JUMP_TO within safe bounds', () => {
    let state = createInitialPlayerState(dummySteps);
    state = playerReducer(state, { type: 'JUMP_TO', index: 2 });
    expect(state.stepIndex).toBe(2);
    expect(state.status).toBe('paused');

    // Out of bounds high
    state = playerReducer(state, { type: 'JUMP_TO', index: 999 });
    expect(state.stepIndex).toBe(3);
    expect(state.status).toBe('completed');

    // Out of bounds low
    state = playerReducer(state, { type: 'JUMP_TO', index: -50 });
    expect(state.stepIndex).toBe(0);
  });

  it('caps frames when exceeding budget limit', () => {
    const hugeSteps: Step[] = Array.from({ length: 12000 }, (_, i) => ({
      engine: 'bars',
      caption: `Step ${i}`,
      line: 1,
      bars: { values: [i] },
    }));

    const { cappedSteps, isCapped } = capFrames(hugeSteps, 100);
    expect(isCapped).toBe(true);
    expect(cappedSteps.length).toBe(100);
    expect(cappedSteps[0].caption).toBe('Step 0');
    expect(cappedSteps[99].caption).toBe('Step 11999');
  });
});

describe('Visualizer Core: Input Parsers and Generators', () => {
  it('parses valid and messy number lists, clamping to max', () => {
    const res1 = parseNumberList('  12, 45,  78,  3  ');
    expect(res1.success).toBe(true);
    expect(res1.value).toEqual([12, 45, 78, 3]);

    const res2 = parseNumberList('[10, 20, 30]');
    expect(res2.success).toBe(true);
    expect(res2.value).toEqual([10, 20, 30]);

    const resErr = parseNumberList('apple, banana');
    expect(resErr.success).toBe(false);
    expect(resErr.error).toContain('numeric values only');

    const resEmpty = parseNumberList('');
    expect(resEmpty.success).toBe(false);
  });

  it('parses target and number lists in multiple formats', () => {
    const res1 = parseTargetAndNumbers('23 | 5, 10, 15, 23, 40');
    expect(res1.success).toBe(true);
    expect(res1.value?.target).toBe(23);
    expect(res1.value?.numbers).toEqual([5, 10, 15, 23, 40]);

    const res2 = parseTargetAndNumbers('target: 99; list: 10, 20, 30');
    expect(res2.success).toBe(true);
    expect(res2.value?.target).toBe(99);
    expect(res2.value?.numbers).toEqual([10, 20, 30]);
  });

  it('parses pattern matching inputs safely', () => {
    const res = parsePatternMatch('text: ABCABCD; pattern: ABC');
    expect(res.success).toBe(true);
    expect(res.value?.text).toBe('ABCABCD');
    expect(res.value?.pattern).toBe('ABC');
  });

  it('parses graph edge lists and grids safely', () => {
    const gRes = parseGraphEdges('A-B, B-C, C-D, A-D');
    expect(gRes.success).toBe(true);
    expect(gRes.value?.nodes).toEqual(['A', 'B', 'C', 'D']);
    expect(gRes.value?.edges.length).toBe(4);

    const gridRes = parseGridInput('0 0 1\n1 0 0\n0 1 0');
    expect(gridRes.success).toBe(true);
    expect(gridRes.value?.rows).toBe(3);
    expect(gridRes.value?.cols).toBe(3);
  });

  it('generates reproducible seeded random numbers', () => {
    const run1 = generateRandomNumbers(6, 10, 90, 42);
    const run2 = generateRandomNumbers(6, 10, 90, 42);
    expect(run1).toEqual(run2);
    expect(run1.length).toBe(6);
  });
});

describe('Visualizer Core: 6 Reusable Engines Algorithms', () => {
  it('Engine 1 (Bars): Bubble Sort finishes sorted without mutating input', () => {
    const testCases = [
      [],
      [42],
      [5, 4, 3, 2, 1],
      [1, 2, 3, 4, 5],
      [3, 1, 4, 1, 5, 9, 2, 6],
      [-5, 12, 0, -2, 8],
    ];

    for (const input of testCases) {
      const copy = [...input];
      const steps = bubbleSortDef.generate(input);
      expect(input).toEqual(copy); // No input mutation
      expect(steps.length).toBeGreaterThan(0);

      const lastStep = steps[steps.length - 1];
      expect(lastStep.engine).toBe('bars');
      if (lastStep.engine === 'bars') {
        const sortedResult = lastStep.bars.values;
        expect(sortedResult).toEqual([...input].sort((a, b) => a - b));
      }
    }
  });

  it('Engine 2 (Array & Pointers): Binary Search accurately locates target or reports absent', () => {
    const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

    // Target present
    const stepsPresent = binarySearchDef.generate({ target: 23, numbers: arr });
    const lastPresent = stepsPresent[stepsPresent.length - 1];
    expect(lastPresent.engine).toBe('array-pointers');
    if (lastPresent.engine === 'array-pointers') {
      expect(lastPresent.array.result).toBe(5);
      expect(lastPresent.caption).toContain('Match found');
    }

    // Target absent
    const stepsAbsent = binarySearchDef.generate({ target: 25, numbers: arr });
    const lastAbsent = stepsAbsent[stepsAbsent.length - 1];
    expect(lastAbsent.engine).toBe('array-pointers');
    if (lastAbsent.engine === 'array-pointers') {
      expect(lastAbsent.array.result).toBe(-1);
      expect(lastAbsent.caption).toContain('not in the array');
    }
  });

  it('Engine 3 (Grid & Table): Fibonacci DP produces correct tabulated values', () => {
    const steps0 = fibonacciDpDef.generate(0);
    expect(steps0.at(-1)?.vars?.result).toBe(0);

    const steps1 = fibonacciDpDef.generate(1);
    expect(steps1.at(-1)?.vars?.result).toBe(1);

    const steps7 = fibonacciDpDef.generate(7);
    expect(steps7.at(-1)?.vars?.result).toBe(13);

    const steps10 = fibonacciDpDef.generate(10);
    expect(steps10.at(-1)?.vars?.result).toBe(55);
  });

  it('Engine 4 (Graph): BFS traverses connected nodes completely', () => {
    const graphInput = {
      nodes: ['A', 'B', 'C', 'D'],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
      ],
      startNode: 'A',
    };
    const steps = bfsGraphDef.generate(graphInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.engine).toBe('graph');
    if (lastStep.engine === 'graph') {
      expect(lastStep.graph.visitedOrder).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('Engine 5 (Tree & Heap): Binary Tree Inorder outputs keys in sorted order', () => {
    const bstKeys = [50, 30, 70, 20, 40, 60, 80];
    const steps = binaryTreeInorderDef.generate(bstKeys);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.engine).toBe('tree-heap');
    expect(lastStep.vars?.output).toBe('20, 30, 40, 50, 60, 70, 80');
  });

  it('Engine 6 (Nodes & Arrows): Reverse Linked List reverses links cleanly', () => {
    const input = [10, 20, 30, 40];
    const steps = reverseLinkedListDef.generate(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.engine).toBe('nodes-arrows');
    expect(lastStep.vars?.newHead).toBe(40);
  });
});

describe('Visualizer Core: Registry & Lazy Loading', () => {
  it('registers metadata for all core categories and engines', () => {
    expect(ALGORITHM_REGISTRY.length).toBeGreaterThan(40);

    const sortingAlgos = getAlgorithmsByCategory('sorting');
    expect(sortingAlgos.length).toBeGreaterThanOrEqual(16);

    const barsAlgos = getAlgorithmsByEngine('bars');
    expect(barsAlgos.length).toBeGreaterThanOrEqual(16);

    const bubbleMeta = getAlgorithmMetadata('bubble-sort');
    expect(bubbleMeta?.name).toBe('Bubble Sort');
    expect(bubbleMeta?.engine).toBe('bars');
  });

  it('dynamically loads algorithm definition modules on demand', async () => {
    const def = await loadAlgorithmDefinition('bubble-sort');
    expect(def).not.toBeNull();
    expect(def?.id).toBe('bubble-sort');
    expect(typeof def?.generate).toBe('function');
  });
});

