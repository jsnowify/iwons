"use client";

import React, { useId } from 'react';
import { ArrayPointersStep, ArrayCellMark } from '../core/types';

interface ArrayPointersEngineProps {
  step: ArrayPointersStep;
}

export function ArrayPointersEngine({ step }: ArrayPointersEngineProps) {
  const maskId = useId();
  const { values, pointers, ranges, marks = {}, result, auxiliaryRow } = step.array;
  const count = values.length;

  if (count === 0) {
    return (
      <div className="engine-empty-message">
        <p>Array is empty. No elements to search or trace.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = auxiliaryRow ? 320 : 250;
  const cellWidth = Math.max(28, Math.min(60, (svgWidth - 80) / count));
  const cellHeight = 44;
  const totalArrayWidth = count * cellWidth;
  const startX = Math.max(30, (svgWidth - totalArrayWidth) / 2);
  const arrayY = 90; // Leave space above for floating pointers

  const getMarkStyles = (mark?: ArrayCellMark) => {
    switch (mark) {
      case 'found':
      case 'match':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', strokeWidth: 3, textColor: 'var(--on-accent, #fff)' };
      case 'checking':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'window':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'eliminated':
      case 'mismatch':
        return { fill: 'var(--surface-sunken, #eae5d9)', stroke: 'var(--border-dim, #ccc)', strokeWidth: 1, textColor: 'var(--muted)', hatched: true };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
    }
  };

  // Stack pointers pointing to the same index vertically
  const pointerBuckets: Record<number, typeof pointers> = {};
  pointers.forEach(p => {
    pointerBuckets[p.index] = pointerBuckets[p.index] || [];
    pointerBuckets[p.index].push(p);
  });

  return (
    <div className="visualizer-engine-container array-pointers-engine">
      {result !== undefined && result !== null && (
        <div className="engine-result-pill" role="status">
          <span className="result-label">Result:</span>{' '}
          <strong className="result-value">
            {typeof result === 'boolean' ? (result ? 'True' : 'False') : result === -1 ? 'Not Found (-1)' : String(result)}
          </strong>
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="engine-svg-stage"
        role="img"
        aria-label="Array and pointers visualization"
      >
        <defs>
          <pattern
            id={`eliminated-hatch-${maskId}`}
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted)" strokeWidth="1" opacity="0.4" />
          </pattern>
        </defs>

        {/* Range Brackets (Sliding window or search interval) */}
        {ranges?.map((range, idx) => {
          const rStartX = startX + range.from * cellWidth;
          const rEndX = startX + (range.to + 1) * cellWidth;
          return (
            <g key={idx} className="range-bracket-group">
              <path
                d={`M ${rStartX} ${arrayY - 4} L ${rStartX} ${arrayY - 12} L ${rEndX} ${arrayY - 12} L ${rEndX} ${arrayY - 4}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              {range.label && (
                <text
                  x={(rStartX + rEndX) / 2}
                  y={arrayY - 16}
                  textAnchor="middle"
                  fill="var(--accent)"
                  fontSize="10px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {range.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Array Cells */}
        {values.map((val, idx) => {
          const x = startX + idx * cellWidth;
          const mark = marks[idx];
          const style = getMarkStyles(mark);

          return (
            <g key={idx} className="array-cell-group" data-mark={mark}>
              {/* Box */}
              <rect
                x={x}
                y={arrayY}
                width={cellWidth}
                height={cellHeight}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                className="array-cell-rect"
              />

              {style.hatched && (
                <rect
                  x={x}
                  y={arrayY}
                  width={cellWidth}
                  height={cellHeight}
                  fill={`url(#eliminated-hatch-${maskId})`}
                  pointerEvents="none"
                />
              )}

              {/* Cell Value */}
              <text
                x={x + cellWidth / 2}
                y={arrayY + 27}
                textAnchor="middle"
                fill={style.textColor}
                fontSize={cellWidth < 36 ? '13px' : '16px'}
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
              >
                {String(val)}
              </text>

              {/* Index below cell */}
              <text
                x={x + cellWidth / 2}
                y={arrayY + cellHeight + 18}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="11px"
                fontFamily="var(--font-mono, monospace)"
              >
                {idx}
              </text>
            </g>
          );
        })}

        {/* Floating Pointers pointing downward */}
        {Object.entries(pointerBuckets).map(([idxStr, bucket]) => {
          const idx = Number(idxStr);
          if (idx < 0 || idx >= count) return null;
          const centerX = startX + idx * cellWidth + cellWidth / 2;

          return (
            <g key={idxStr} className="pointer-stack">
              {bucket.map((pointer, stackIdx) => {
                const arrowBottomY = arrayY - 6 - stackIdx * 24;
                const arrowTopY = arrowBottomY - 12;

                return (
                  <g key={pointer.name} className="pointer-item">
                    {/* Downward triangle/arrow */}
                    <polygon
                      points={`${centerX},${arrowBottomY} ${centerX - 4},${arrowTopY} ${centerX + 4},${arrowTopY}`}
                      fill="var(--ink)"
                    />
                    {/* Pointer label badge */}
                    <rect
                      x={centerX - 16}
                      y={arrowTopY - 16}
                      width="32"
                      height="15"
                      fill="var(--ink)"
                      rx="2"
                    />
                    <text
                      x={centerX}
                      y={arrowTopY - 5}
                      textAnchor="middle"
                      fill="var(--surface)"
                      fontSize="9px"
                      fontWeight="700"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {pointer.name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Auxiliary Row (e.g. Failure Table / Prefix sums) */}
        {auxiliaryRow && (
          <g className="auxiliary-array-row" transform={`translate(0, ${arrayY + cellHeight + 36})`}>
            <text
              x={startX - 10}
              y="22"
              textAnchor="end"
              fill="var(--muted)"
              fontSize="11px"
              fontWeight="700"
              fontFamily="var(--font-mono, monospace)"
            >
              {auxiliaryRow.label}
            </text>
            {auxiliaryRow.values.map((v, i) => {
              const x = startX + i * cellWidth;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y="4"
                    width={cellWidth}
                    height="28"
                    fill="var(--surface)"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  {v !== null && v !== undefined && (
                    <text
                      x={x + cellWidth / 2}
                      y="22"
                      textAnchor="middle"
                      fill="var(--ink)"
                      fontSize="12px"
                      fontFamily="var(--font-mono, monospace)"
                      fontWeight="600"
                    >
                      {String(v)}
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
