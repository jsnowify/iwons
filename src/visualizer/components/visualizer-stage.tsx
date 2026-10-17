"use client";

import React from 'react';
import { Step, EngineType } from '../core/types';
import { EngineRouter } from '../engines/engine-router';
import { RotateCcw } from 'lucide-react';

interface VisualizerStageProps {
  step: Step;
  stepIndex: number;
  totalSteps: number;
  isCompleted: boolean;
  onReplay: () => void;
  predictMode?: boolean;
}

export function VisualizerStage({
  step,
  stepIndex,
  totalSteps,
  isCompleted,
  onReplay,
}: VisualizerStageProps) {
  const getLegendItems = (engine: EngineType) => {
    switch (engine) {
      case 'bars':
        return [
          { label: 'Unsorted', className: 'legend-default' },
          { label: 'Compared', className: 'legend-compared' },
          { label: 'Swapped', className: 'legend-swapped' },
          { label: 'Sorted', className: 'legend-sorted' },
          { label: 'Pivot', className: 'legend-pivot' },
        ];
      case 'array-pointers':
        return [
          { label: 'Default', className: 'legend-default' },
          { label: 'Checking', className: 'legend-checking' },
          { label: 'Found / Match', className: 'legend-found' },
          { label: 'Eliminated', className: 'legend-eliminated' },
        ];
      case 'grid-table':
        return [
          { label: 'Computed', className: 'legend-computed' },
          { label: 'Current', className: 'legend-current' },
          { label: 'Source', className: 'legend-source' },
          { label: 'Traceback Path', className: 'legend-path' },
        ];
      case 'graph':
        return [
          { label: 'Unvisited', className: 'legend-default' },
          { label: 'Frontier / Queue', className: 'legend-frontier' },
          { label: 'Current', className: 'legend-current' },
          { label: 'Visited', className: 'legend-visited' },
          { label: 'Tree Edge', className: 'legend-tree-edge' },
        ];
      case 'tree-heap':
        return [
          { label: 'Unvisited', className: 'legend-default' },
          { label: 'Current Node', className: 'legend-current' },
          { label: 'Visited', className: 'legend-visited' },
          { label: 'Rotated / Swapped', className: 'legend-rotated' },
        ];
      case 'nodes-arrows':
        return [
          { label: 'Node Box', className: 'legend-default' },
          { label: 'Active (curr)', className: 'legend-current' },
          { label: 'Previous (prev)', className: 'legend-source' },
        ];
    }
  };

  const legend = getLegendItems(step.engine);

  const getAccessibleSummary = (): string => {
    switch (step.engine) {
      case 'bars': {
        const { values, marks = {} } = step.bars;
        const compared: number[] = [];
        const swapped: number[] = [];
        Object.entries(marks).forEach(([idx, mark]) => {
          if (mark === 'compared') compared.push(Number(idx));
          if (mark === 'swapped') swapped.push(Number(idx));
        });
        let detail = '';
        if (swapped.length > 0) {
          detail = `, currently swapping index ${swapped.join(' and ')}`;
        } else if (compared.length > 0) {
          detail = `, currently comparing index ${compared.join(' and ')}`;
        }
        return `Array of ${values.length} elements${detail}.`;
      }
      case 'array-pointers': {
        const { values, pointers = [] } = step.array;
        const ptrDesc = pointers.length
          ? `, pointers: ${pointers.map(p => `${p.name} at index ${p.index}`).join(', ')}`
          : '';
        return `Array of ${values.length} elements${ptrDesc}.`;
      }
      case 'grid-table': {
        const { rows, cols } = step.grid;
        return `Grid table of ${rows} rows and ${cols} columns.`;
      }
      case 'graph': {
        const { nodes, edges } = step.graph;
        return `Graph with ${nodes.length} vertices and ${edges.length} edges.`;
      }
      case 'tree-heap': {
        const { treeNodes } = step.tree;
        return `Binary tree with ${treeNodes.length} nodes.`;
      }
      case 'nodes-arrows': {
        const { nodes } = step.nodesArrows;
        return `Linked structure with ${nodes.length} nodes.`;
      }
      default:
        return 'Algorithm visualization stage.';
    }
  };

  const accessibleSummary = getAccessibleSummary();

  return (
    <section className="visualizer-stage-wrapper" aria-label="Algorithm animation stage">
      {/* Accessible textual summary for screen readers */}
      <div className="visually-hidden" role="status" aria-live="polite" id="stage-text-summary">
        {accessibleSummary}
      </div>

      {/* Pinned Step Caption directly above stage for continuous reading */}
      <div className="stage-pinned-caption">
        <div className="caption-badge">
          Step {stepIndex + 1} of {Math.max(1, totalSteps)}
        </div>
        <p className="caption-text" aria-live="polite">
          {step.caption}
        </p>
      </div>

      {/* Main Canvas Viewport */}
      <div
        className="stage-canvas-card"
        role="region"
        aria-label="Algorithm visualization canvas"
        aria-describedby="stage-text-summary"
      >
        <EngineRouter step={step} />

        {/* Completion Overlay Banner */}
        {isCompleted && (
          <div className="stage-completion-banner" role="status">
            <div className="completion-card">
              <div className="completion-title">Algorithm Complete</div>
              <p className="completion-desc">
                Finished tracing in {totalSteps} frames. All operations verified.
              </p>
              <button
                type="button"
                className="btn primary replay-btn"
                onClick={onReplay}
                aria-label="Replay algorithm animation from beginning"
              >
                <RotateCcw size={16} aria-hidden="true" />
                <span>Replay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Non-color cue Legend below stage */}
      <div className="stage-footer-legend" aria-label="Visual state legend">
        <div className="legend-items">
          {legend.map(item => (
            <span key={item.label} className={`legend-chip ${item.className}`}>
              <span className="legend-swatch" aria-hidden="true" />
              <span className="legend-text">{item.label}</span>
            </span>
          ))}
        </div>
        <span className="keyboard-hint" title="Space: play/pause, Left/Right: step, Home/End: first/last, R: reset">
          Shortcuts: <kbd>Space</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>R</kbd>
        </span>
      </div>
    </section>
  );
}
