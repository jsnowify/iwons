import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { VisualizerTopBar } from '../visualizer/components/visualizer-top-bar';
import { VisualizerStage } from '../visualizer/components/visualizer-stage';
import { VisualizerSidePanel } from '../visualizer/components/visualizer-side-panel';
import { EngineRouter } from '../visualizer/engines/engine-router';
import bubbleSortDef from '../visualizer/algorithms/sorting/bubble-sort';
import binarySearchDef from '../visualizer/algorithms/searching/binary-search';
import fibonacciDpDef from '../visualizer/algorithms/dp/fibonacci-dp';
import bfsGraphDef from '../visualizer/algorithms/graphs/bfs-graph';
import binaryTreeInorderDef from '../visualizer/algorithms/trees/binary-tree-inorder';
import reverseLinkedListDef from '../visualizer/algorithms/linked-lists/reverse-linked-list';

describe('Visualizer Layout Components (Phase V2)', () => {
  it('VisualizerTopBar renders metadata, category chip, and all 4 complexity chips', () => {
    const html = renderToString(React.createElement(VisualizerTopBar, { algorithm: bubbleSortDef }));
    expect(html).toContain('Bubble Sort');
    expect(html).toContain('sorting');
    expect(html).toContain('O(n)');
    expect(html).toContain('O(n²)');
    expect(html).toContain('O(1)');
    expect(html).toContain('Library');
  });

  it('VisualizerStage renders pinned caption and appropriate engine legend', () => {
    const steps = bubbleSortDef.generate([3, 1, 2]);
    const html = renderToString(
      React.createElement(VisualizerStage, {
        step: steps[0],
        stepIndex: 0,
        totalSteps: steps.length,
        isCompleted: false,
        onReplay: () => {},
      })
    );
    expect(html).toContain('Step');
    expect(html).toContain('Start Bubble Sort');
    expect(html).toContain('Compared');
    expect(html).toContain('Swapped');
    expect(html).toContain('Sorted');
    expect(html).toContain('Shortcuts:');
  });

  it('VisualizerStage renders completion banner when isCompleted is true', () => {
    const steps = bubbleSortDef.generate([2, 1]);
    const html = renderToString(
      React.createElement(VisualizerStage, {
        step: steps[steps.length - 1],
        stepIndex: steps.length - 1,
        totalSteps: steps.length,
        isCompleted: true,
        onReplay: () => {},
      })
    );
    expect(html).toContain('Algorithm Complete');
    expect(html).toContain('Replay');
  });

  it('VisualizerSidePanel renders caption, highlighted pseudocode, and variables', () => {
    const steps = binarySearchDef.generate({ target: 29, numbers: [10, 20, 29, 40] });
    const stepWithVars = steps.find(s => s.line > 0 && s.vars && Object.keys(s.vars).length > 0) || steps[1];

    const html = renderToString(
      React.createElement(VisualizerSidePanel, {
        step: stepWithVars,
        stepIndex: 1,
        totalSteps: steps.length,
        pseudocode: binarySearchDef.pseudocode,
        algorithm: binarySearchDef,
      })
    );

    expect(html).toContain('PSEUDOCODE');
    expect(html).toContain('binarySearch');
    expect(html).toContain('ACTIVE VARIABLES');
    expect(html).toContain('ABOUT ALGORITHM');
    expect(html).toContain(binarySearchDef.blurb);
  });

  it('EngineRouter renders all 6 engines without throwing', () => {
    const step1 = bubbleSortDef.generate([5, 2])[0];
    const html1 = renderToString(React.createElement(EngineRouter, { step: step1 }));
    expect(html1).toContain('bars-engine');

    const step2 = binarySearchDef.generate({ target: 5, numbers: [1, 5, 9] })[0];
    const html2 = renderToString(React.createElement(EngineRouter, { step: step2 }));
    expect(html2).toContain('array-pointers-engine');

    const step3 = fibonacciDpDef.generate(4)[0];
    const html3 = renderToString(React.createElement(EngineRouter, { step: step3 }));
    expect(html3).toContain('grid-table-engine');

    const step4 = bfsGraphDef.generate({ nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }] })[0];
    const html4 = renderToString(React.createElement(EngineRouter, { step: step4 }));
    expect(html4).toContain('graph-engine');

    const step5 = binaryTreeInorderDef.generate([2, 1, 3])[0];
    const html5 = renderToString(React.createElement(EngineRouter, { step: step5 }));
    expect(html5).toContain('tree-heap-engine');

    const step6 = reverseLinkedListDef.generate([1, 2, 3])[0];
    const html6 = renderToString(React.createElement(EngineRouter, { step: step6 }));
    expect(html6).toContain('nodes-arrows-engine');
  });
});
