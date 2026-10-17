"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AlgoMetadata } from '../core/types';

interface VisualizerTopBarProps {
  algorithm: AlgoMetadata;
}

export function VisualizerTopBar({ algorithm }: VisualizerTopBarProps) {
  const { name, category, complexity } = algorithm;

  return (
    <header className="visualizer-top-bar" aria-label="Visualizer header">
      <div className="top-bar-left">
        <Link href="/visualizer/" className="back-library-link" aria-label="Back to Algorithm Library">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Library</span>
        </Link>
        <span className="top-bar-divider" aria-hidden="true">/</span>
        <h1 className="algorithm-heading">{name}</h1>
        <span className="category-chip" data-category={category}>
          {category.replace(/-/g, ' ')}
        </span>
      </div>

      <div className="top-bar-right" aria-label="Algorithm complexity">
        <div className="complexity-chips">
          <span className="complexity-chip best" title="Best-case time complexity">
            <small>Best</small> <strong>{complexity.best}</strong>
          </span>
          <span className="complexity-chip avg" title="Average time complexity">
            <small>Avg</small> <strong>{complexity.average}</strong>
          </span>
          <span className="complexity-chip worst" title="Worst-case time complexity">
            <small>Worst</small> <strong>{complexity.worst}</strong>
          </span>
          <span className="complexity-chip space" title="Space complexity">
            <small>Space</small> <strong>{complexity.space}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
