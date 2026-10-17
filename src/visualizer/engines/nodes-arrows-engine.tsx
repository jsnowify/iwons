"use client";

import React from 'react';
import { NodesArrowsStep, NodeArrowMark } from '../core/types';

interface NodesArrowsEngineProps {
  step: NodesArrowsStep;
}

export function NodesArrowsEngine({ step }: NodesArrowsEngineProps) {
  const { nodes, headId, pointers, buckets, cacheList } = step.nodesArrows;

  if (nodes.length === 0) {
    return (
      <div className="engine-empty-message">
        <p>List is empty.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = buckets ? 380 : 300;

  const nodeWidth = 72;
  const nodeHeight = 44;
  const gap = 38;
  const totalLength = nodes.length * nodeWidth + (nodes.length - 1) * gap;
  const startX = Math.max(30, (svgWidth - totalLength) / 2);
  const startY = 120; // Room above for floating pointers

  const getNodeStyles = (mark?: NodeArrowMark) => {
    switch (mark) {
      case 'active':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', strokeWidth: 3, textColor: 'var(--on-accent, #fff)' };
      case 'current':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'target':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
    }
  };

  const nodePos = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, idx) => {
    nodePos.set(n.id, {
      x: startX + idx * (nodeWidth + gap),
      y: startY,
    });
  });

  return (
    <div className="visualizer-engine-container nodes-arrows-engine">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="engine-svg-stage"
        role="img"
        aria-label="Nodes and arrows linked structure visualization"
      >
        <defs>
          <marker
            id="link-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--ink)" />
          </marker>
        </defs>

        {/* Nodes and Links */}
        {nodes.map(n => {
          const pos = nodePos.get(n.id);
          if (!pos) return null;
          const style = getNodeStyles(n.mark);
          const isHead = n.id === headId;

          // Next pointer arrow
          const nextPos = n.next ? nodePos.get(n.next) : null;

          return (
            <g key={n.id} className="node-item-group" data-mark={n.mark}>
              {/* Node Outer Box */}
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                className="linked-node-rect"
                rx="3"
              />

              {/* Data partition divider */}
              <line
                x1={pos.x + nodeWidth * 0.65}
                y1={pos.y}
                x2={pos.x + nodeWidth * 0.65}
                y2={pos.y + nodeHeight}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />

              {/* Node Value */}
              <text
                x={pos.x + (nodeWidth * 0.65) / 2}
                y={pos.y + 27}
                textAnchor="middle"
                fill={style.textColor}
                fontSize="15px"
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
              >
                {String(n.val)}
              </text>

              {/* Pointer anchor dot */}
              <circle
                cx={pos.x + nodeWidth * 0.82}
                cy={pos.y + nodeHeight / 2}
                r="3"
                fill="var(--ink)"
              />

              {/* Next arrow connection */}
              {nextPos ? (
                <path
                  d={`M ${pos.x + nodeWidth} ${pos.y + nodeHeight / 2} L ${nextPos.x} ${nextPos.y + nodeHeight / 2}`}
                  stroke="var(--ink)"
                  strokeWidth="2"
                  markerEnd="url(#link-arrow)"
                />
              ) : (
                <text
                  x={pos.x + nodeWidth + 14}
                  y={pos.y + nodeHeight / 2 + 4}
                  fill="var(--muted)"
                  fontSize="10px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  NULL
                </text>
              )}

              {/* Head Indicator Badge */}
              {isHead && (
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + nodeHeight + 18}
                  textAnchor="middle"
                  fill="var(--accent)"
                  fontSize="10px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  [HEAD]
                </text>
              )}
            </g>
          );
        })}

        {/* Floating Pointers (prev, curr, next) */}
        {pointers?.map((p, idx) => {
          const targetPos = nodePos.get(p.nodeId);
          if (!targetPos) return null;
          const centerX = targetPos.x + (nodeWidth * 0.65) / 2;
          const arrowBottomY = targetPos.y - 6 - idx * 26;
          const arrowTopY = arrowBottomY - 12;

          return (
            <g key={p.name} className="node-pointer-indicator">
              <polygon
                points={`${centerX},${arrowBottomY} ${centerX - 4},${arrowTopY} ${centerX + 4},${arrowTopY}`}
                fill="var(--ink)"
              />
              <rect
                x={centerX - 18}
                y={arrowTopY - 16}
                width="36"
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
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Hash Buckets strip if present */}
        {buckets && buckets.length > 0 && (
          <g className="hash-buckets-strip" transform={`translate(40, ${startY + nodeHeight + 40})`}>
            <text x="0" y="0" fill="var(--muted)" fontSize="11px" fontWeight="700" fontFamily="var(--font-mono, monospace)">
              HASH TABLE BUCKETS (SEPARATE CHAINS):
            </text>
            {buckets.map((b, i) => (
              <g key={b.index} transform={`translate(${i * 140}, 14)`}>
                <rect x="0" y="0" width="130" height="26" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" rx="3" />
                <rect x="0" y="0" width="30" height="26" fill="var(--ink)" rx="3 0 0 3" />
                <text x="15" y="17" textAnchor="middle" fill="var(--surface)" fontSize="11px" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                  [{b.index}]
                </text>
                <text x="78" y="17" textAnchor="middle" fill="var(--ink)" fontSize="11px" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                  {b.nodeIds.length > 0 ? b.nodeIds.map(id => nodePos.has(id) ? (nodes.find(n => n.id === id)?.val ?? id) : id).join(' → ') : 'empty'}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Cache List if present */}
        {cacheList && (
          <g className="cache-list-strip" transform={`translate(40, ${startY + nodeHeight + 40})`}>
            <text x="0" y="0" fill="var(--muted)" fontSize="11px" fontWeight="700" fontFamily="var(--font-mono, monospace)">
              RECENTLY USED ORDER (MOST → LEAST):
            </text>
            {cacheList.map((item, i) => (
              <g key={i} transform={`translate(${i * 65}, 10)`}>
                <rect x="0" y="0" width="55" height="24" fill="var(--accent-soft)" stroke="var(--ink)" strokeWidth="1" rx="2" />
                <text x="27" y="16" textAnchor="middle" fill="var(--ink)" fontSize="11px" fontWeight="700">
                  {item}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
