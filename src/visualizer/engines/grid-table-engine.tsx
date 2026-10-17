"use client";

import React from 'react';
import { GridTableStep, GridCellMark } from '../core/types';

interface GridTableEngineProps {
  step: GridTableStep;
}

export function GridTableEngine({ step }: GridTableEngineProps) {
  const { rows, cols, cells, rowLabels, colLabels, tracebackPath } = step.grid;

  if (rows === 0 || cols === 0) {
    return (
      <div className="engine-empty-message">
        <p>Grid has zero dimensions.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 360;

  const headerLeftOffset = rowLabels ? 60 : 30;
  const headerTopOffset = colLabels ? 45 : 30;

  const availableWidth = svgWidth - headerLeftOffset - 30;
  const availableHeight = svgHeight - headerTopOffset - 30;

  const cellWidth = Math.max(24, Math.min(65, availableWidth / cols));
  const cellHeight = Math.max(24, Math.min(48, availableHeight / rows));

  const totalGridWidth = cols * cellWidth;
  const totalGridHeight = rows * cellHeight;

  const gridStartX = headerLeftOffset + Math.max(0, (availableWidth - totalGridWidth) / 2);
  const gridStartY = headerTopOffset + Math.max(0, (availableHeight - totalGridHeight) / 2);

  // Map cells by "r,c" for O(1) lookup
  const cellMap = new Map<string, (typeof cells)[0]>();
  cells.forEach(c => cellMap.set(`${c.r},${c.c}`, c));

  const getCellStyles = (mark?: GridCellMark) => {
    switch (mark) {
      case 'current':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', strokeWidth: 3, textColor: 'var(--on-accent, #fff)' };
      case 'source':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'computed':
      case 'visited':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 1.5, textColor: 'var(--ink)' };
      case 'path':
        return { fill: 'var(--accent-3, #d97706)', stroke: 'var(--ink)', strokeWidth: 3, textColor: '#fff' };
      case 'wall':
        return { fill: 'var(--ink)', stroke: 'var(--ink)', strokeWidth: 1, textColor: 'var(--surface)' };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 1.5, textColor: 'var(--ink)' };
    }
  };

  return (
    <div className="visualizer-engine-container grid-table-engine">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="engine-svg-stage"
        role="img"
        aria-label="Grid and table visualization"
      >
        {/* Column Labels */}
        {colLabels?.map((label, c) => (
          <text
            key={c}
            x={gridStartX + c * cellWidth + cellWidth / 2}
            y={gridStartY - 10}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="11px"
            fontWeight="700"
            fontFamily="var(--font-mono, monospace)"
          >
            {label}
          </text>
        ))}

        {/* Row Labels */}
        {rowLabels?.map((label, r) => (
          <text
            key={r}
            x={gridStartX - 10}
            y={gridStartY + r * cellHeight + cellHeight / 2 + 4}
            textAnchor="end"
            fill="var(--muted)"
            fontSize="11px"
            fontWeight="700"
            fontFamily="var(--font-mono, monospace)"
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const cell = cellMap.get(`${r},${c}`);
            const mark = cell?.mark;
            const style = getCellStyles(mark);
            const x = gridStartX + c * cellWidth;
            const y = gridStartY + r * cellHeight;

            return (
              <g key={`${r},${c}`} className="grid-cell-group" data-mark={mark}>
                <rect
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  className="grid-cell-rect"
                />
                <text
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2 + 5}
                  textAnchor="middle"
                  fill={style.textColor}
                  fontSize={cellWidth < 30 ? '11px' : '14px'}
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {cell?.value !== undefined ? String(cell.value) : ''}
                </text>
              </g>
            );
          })
        )}

        {/* Traceback Path Connecting Polyline */}
        {tracebackPath && tracebackPath.length > 1 && (
          <polyline
            points={tracebackPath
              .map(([r, c]) => `${gridStartX + c * cellWidth + cellWidth / 2},${gridStartY + r * cellHeight + cellHeight / 2}`)
              .join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
        )}
      </svg>
    </div>
  );
}
