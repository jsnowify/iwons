"use client";

import React from 'react';
import { Step } from '../core/types';
import { BarsEngine } from './bars-engine';
import { ArrayPointersEngine } from './array-pointers-engine';
import { GridTableEngine } from './grid-table-engine';
import { GraphEngine } from './graph-engine';
import { TreeHeapEngine } from './tree-heap-engine';
import { NodesArrowsEngine } from './nodes-arrows-engine';

interface EngineRouterProps {
  step: Step;
}

export function EngineRouter({ step }: EngineRouterProps) {
  switch (step.engine) {
    case 'bars':
      return <BarsEngine step={step} />;
    case 'array-pointers':
      return <ArrayPointersEngine step={step} />;
    case 'grid-table':
      return <GridTableEngine step={step} />;
    case 'graph':
      return <GraphEngine step={step} />;
    case 'tree-heap':
      return <TreeHeapEngine step={step} />;
    case 'nodes-arrows':
      return <NodesArrowsEngine step={step} />;
    default:
      return (
        <div className="engine-unknown-message">
          <p>Unknown visualizer engine type.</p>
        </div>
      );
  }
}

