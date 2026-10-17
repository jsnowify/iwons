"use client";

import React, { useState } from 'react';
import { Step, AlgoMetadata } from '../core/types';

interface VisualizerSidePanelProps {
  step: Step;
  stepIndex: number;
  totalSteps: number;
  pseudocode: string[];
  algorithm: AlgoMetadata;
}

type MobileTab = 'steps' | 'code' | 'vars' | 'about';

export function VisualizerSidePanel({
  step,
  stepIndex,
  totalSteps,
  pseudocode,
  algorithm,
}: VisualizerSidePanelProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('steps');
  const vars = step.vars || {};
  const hasVars = Object.keys(vars).length > 0;

  return (
    <aside className="visualizer-side-panel" aria-label="Algorithm details and pseudocode">
      {/* Mobile Tab Header (Visible under 1024px) */}
      <div className="mobile-tabs-header" role="tablist" aria-label="Side panel sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'steps'}
          aria-controls="panel-tab-steps"
          className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          Steps
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'code'}
          aria-controls="panel-tab-code"
          className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vars'}
          aria-controls="panel-tab-vars"
          className={`tab-btn ${activeTab === 'vars' ? 'active' : ''}`}
          onClick={() => setActiveTab('vars')}
        >
          Variables
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'about'}
          aria-controls="panel-tab-about"
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {/* Card 1: What's Happening */}
      <div
        id="panel-tab-steps"
        role="tabpanel"
        className={`panel-card card-happening ${activeTab === 'steps' ? 'mobile-visible' : ''}`}
      >
        <div className="card-header">
          <span className="card-eyebrow">WHAT&apos;S HAPPENING</span>
          <span className="step-counter-tag">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <p className="caption-body" aria-live="polite">
          {step.caption}
        </p>
      </div>

      {/* Card 2: Pseudocode */}
      <div
        id="panel-tab-code"
        role="tabpanel"
        className={`panel-card card-pseudocode ${activeTab === 'code' ? 'mobile-visible' : ''}`}
      >
        <div className="card-header">
          <span className="card-eyebrow">PSEUDOCODE</span>
          {step.line > 0 && <span className="line-indicator-tag">Line {step.line}</span>}
        </div>
        <div className="code-listing" role="region" aria-label="Highlighted pseudocode">
          {pseudocode.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = step.line === lineNum;

            return (
              <div
                key={lineNum}
                className={`code-line ${isHighlighted ? 'highlighted' : ''}`}
                data-line={lineNum}
              >
                <span className="line-num" aria-hidden="true">
                  {lineNum}
                </span>
                <span className="line-text">{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Variables Inspector */}
      <div
        id="panel-tab-vars"
        role="tabpanel"
        className={`panel-card card-variables ${activeTab === 'vars' ? 'mobile-visible' : ''}`}
      >
        <div className="card-header">
          <span className="card-eyebrow">ACTIVE VARIABLES</span>
        </div>
        {hasVars ? (
          <dl className="variables-list">
            {Object.entries(vars).map(([name, val]) => (
              <div key={name} className="variable-row">
                <dt className="var-name">{name}</dt>
                <dd className="var-value">{String(val)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="no-vars-msg">No active variables at this step.</p>
        )}
      </div>

      {/* Card 4: About & Complexity */}
      <div
        id="panel-tab-about"
        role="tabpanel"
        className={`panel-card card-about ${activeTab === 'about' ? 'mobile-visible' : ''}`}
      >
        <div className="card-header">
          <span className="card-eyebrow">ABOUT ALGORITHM</span>
        </div>
        <p className="about-blurb">{algorithm.blurb}</p>

        <div className="about-complexity-table">
          <div className="complexity-row">
            <span className="c-label">Best Time:</span>
            <span className="c-val">{algorithm.complexity.best}</span>
          </div>
          <div className="complexity-row">
            <span className="c-label">Average Time:</span>
            <span className="c-val">{algorithm.complexity.average}</span>
          </div>
          <div className="complexity-row">
            <span className="c-label">Worst Time:</span>
            <span className="c-val">{algorithm.complexity.worst}</span>
          </div>
          <div className="complexity-row">
            <span className="c-label">Space:</span>
            <span className="c-val">{algorithm.complexity.space}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
