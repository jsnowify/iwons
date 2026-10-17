"use client";

import React, { useId } from 'react';
import { BarsStep, BarMark } from '../core/types';

interface BarsEngineProps {
  step: BarsStep;
}

export function BarsEngine({ step }: BarsEngineProps) {
  const maskId = useId();
  const { values, marks = {}, counters, auxiliary } = step.bars;
  const count = values.length;

  if (count === 0) {
    return (
      <div className="engine-empty-message">
        <p>Array is empty. Add elements or select a preset to visualize sorting.</p>
      </div>
    );
  }

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = auxiliary ? 380 : 320;
  const mainStageHeight = auxiliary ? 230 : 270;
  const baselineY = mainStageHeight - 40;

  // Scaling calculations
  const maxVal = Math.max(1, ...values.map(v => Math.abs(v)));
  const minVal = Math.min(0, ...values);
  const valRange = maxVal - minVal;
  const usableHeight = baselineY - 40;

  const paddingX = 40;
  const totalBarSpace = svgWidth - paddingX * 2;
  const gap = count > 30 ? 2 : count > 15 ? 4 : 8;
  const barWidth = Math.max(8, (totalBarSpace - gap * (count - 1)) / count);
  const showLabels = count <= 25;

  const getMarkDetails = (mark?: BarMark) => {
    switch (mark) {
      case 'compared':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', label: 'comparing' };
      case 'swapped':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', label: 'swapping' };
      case 'sorted':
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 3, label: 'sorted', pattern: true };
      case 'pivot':
        return { fill: 'var(--accent-3, #d97706)', stroke: 'var(--ink)', label: 'pivot' };
      case 'range':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', label: 'active range' };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)' };
    }
  };

  return (
    <div className="visualizer-engine-container bars-engine">
      <div className="engine-header-meta">
        {counters && (
          <div className="engine-counters" aria-label="Operation metrics">
            <span className="counter-item">
              <strong className="counter-label">Comparisons:</strong>{' '}
              <span className="counter-value">{counters.comparisons ?? 0}</span>
            </span>
            <span className="counter-item">
              <strong className="counter-label">Swaps:</strong>{' '}
              <span className="counter-value">{counters.swaps ?? 0}</span>
            </span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="engine-svg-stage"
        role="img"
        aria-label="Sorting bars visualization"
      >
        <defs>
          {/* Non-color cue: Hatch pattern for sorted elements */}
          <pattern
            id={`sorted-hatch-${maskId}`}
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink)" strokeWidth="1.5" opacity="0.35" />
          </pattern>
        </defs>

        {/* Baseline ground line */}
        <line
          x1={paddingX - 10}
          y1={baselineY}
          x2={svgWidth - paddingX + 10}
          y2={baselineY}
          stroke="var(--ink)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        {/* Bars */}
        {values.map((val, idx) => {
          const barHeight = Math.max(12, Math.round((Math.abs(val) / maxVal) * usableHeight));
          const x = paddingX + idx * (barWidth + gap);
          const y = baselineY - barHeight;
          const mark = marks[idx];
          const style = getMarkDetails(mark);

          return (
            <g key={idx} className="bar-group" data-mark={mark}>
              {/* Primary Bar Rectangle */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth ?? 2}
                className="bar-rect"
                rx="2"
              />

              {/* Sorted pattern overlay for colorblind non-color cue */}
              {mark === 'sorted' && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#sorted-hatch-${maskId})`}
                  pointerEvents="none"
                  rx="2"
                />
              )}

              {/* Value Label above bar */}
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="bar-value-label"
                  fill="var(--ink)"
                  fontSize={barWidth < 22 ? '10px' : '12px'}
                  fontWeight={mark ? '700' : '500'}
                  fontFamily="var(--font-mono, monospace)"
                >
                  {val}
                </text>
              )}

              {/* Index label below ground line */}
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={baselineY + 18}
                  textAnchor="middle"
                  className="bar-index-label"
                  fill="var(--muted)"
                  fontSize="10px"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {idx}
                </text>
              )}

              {/* Pivot marker indicator */}
              {mark === 'pivot' && (
                <polygon
                  points={`${x + barWidth / 2},${y - 22} ${x + barWidth / 2 - 5},${y - 28} ${x + barWidth / 2 + 5},${y - 28}`}
                  fill="var(--accent)"
                />
              )}
            </g>
          );
        })}

        {/* Auxiliary Array Area (Merge / Radix / Counting buffers) */}
        {auxiliary && (
          <g className="auxiliary-stage" transform={`translate(0, ${mainStageHeight + 10})`}>
            <text
              x={paddingX}
              y="16"
              fill="var(--muted)"
              fontSize="11px"
              fontWeight="700"
              fontFamily="var(--font-mono, monospace)"
            >
              {auxiliary.label.toUpperCase()}
            </text>
            {auxiliary.values.map((v, i) => {
              const x = paddingX + i * (barWidth + gap);
              const isEmpty = v === null || v === undefined;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y="24"
                    width={barWidth}
                    height="28"
                    fill={isEmpty ? 'transparent' : 'var(--accent-soft)'}
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                    strokeDasharray={isEmpty ? '2 2' : undefined}
                    rx="2"
                  />
                  {!isEmpty && (
                    <text
                      x={x + barWidth / 2}
                      y="42"
                      textAnchor="middle"
                      fill="var(--ink)"
                      fontSize="11px"
                      fontFamily="var(--font-mono, monospace)"
                      fontWeight="600"
                    >
                      {v}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
