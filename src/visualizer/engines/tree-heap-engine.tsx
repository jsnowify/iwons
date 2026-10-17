"use client";

import React from 'react';
import { TreeHeapStep, TreeNodeMark } from '../core/types';

interface TreeHeapEngineProps {
  step: TreeHeapStep;
}

export function TreeHeapEngine({ step }: TreeHeapEngineProps) {
  const { treeNodes, heapArray, callStack } = step.tree;

  if (treeNodes.length === 0 && (!heapArray || heapArray.length === 0)) {
    return (
      <div className="engine-empty-message">
        <p>Tree is empty. Insert keys or select a preset to begin.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = heapArray ? 360 : 320;
  const nodeRadius = 18;

  // Map nodes by id for quick child coordinate lookup
  const nodeMap = new Map<string, (typeof treeNodes)[0]>();
  treeNodes.forEach(n => nodeMap.set(n.id, n));

  const getNodeStyles = (mark?: TreeNodeMark) => {
    switch (mark) {
      case 'current':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', strokeWidth: 3, textColor: 'var(--on-accent, #fff)' };
      case 'visited':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'inserted':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', strokeWidth: 2.5, textColor: 'var(--ink)' };
      case 'rotated':
        return { fill: 'var(--accent-3, #d97706)', stroke: 'var(--ink)', strokeWidth: 3, textColor: '#fff' };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
    }
  };

  return (
    <div className="visualizer-engine-container tree-heap-engine">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="engine-svg-stage"
        role="img"
        aria-label="Tree and heap visualization"
      >
        {/* Tree Edges */}
        {treeNodes.map(n => {
          const leftChild = n.left ? nodeMap.get(n.left) : null;
          const rightChild = n.right ? nodeMap.get(n.right) : null;

          return (
            <g key={`edges-${n.id}`}>
              {leftChild && n.x !== undefined && n.y !== undefined && leftChild.x !== undefined && leftChild.y !== undefined && (
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={leftChild.x}
                  y2={leftChild.y}
                  stroke="var(--ink)"
                  strokeWidth="2"
                />
              )}
              {rightChild && n.x !== undefined && n.y !== undefined && rightChild.x !== undefined && rightChild.y !== undefined && (
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={rightChild.x}
                  y2={rightChild.y}
                  stroke="var(--ink)"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}

        {/* Tree Nodes */}
        {treeNodes.map(n => {
          if (n.x === undefined || n.y === undefined) return null;
          const style = getNodeStyles(n.mark);

          return (
            <g key={n.id} className="tree-node-group" data-mark={n.mark}>
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeRadius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                className="tree-node-circle"
              />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fill={style.textColor}
                fontSize="12px"
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
              >
                {String(n.val)}
              </text>
            </g>
          );
        })}

        {/* Call Stack / Output strip (Right side) */}
        {callStack && callStack.length > 0 && (
          <g className="call-stack-stage" transform="translate(560, 24)">
            <rect
              x="0"
              y="0"
              width="210"
              height="200"
              fill="var(--surface)"
              stroke="var(--ink)"
              strokeWidth="2"
              rx="4"
            />
            <rect x="0" y="0" width="210" height="26" fill="var(--ink)" rx="4 4 0 0" />
            <text
              x="12"
              y="18"
              fill="var(--surface)"
              fontSize="11px"
              fontWeight="700"
              fontFamily="var(--font-mono, monospace)"
            >
              CALL STACK & OUTPUT
            </text>
            {callStack.map((item, i) => (
              <g key={i} transform={`translate(12, ${38 + i * 34})`}>
                <text
                  x="0"
                  y="12"
                  fill="var(--muted)"
                  fontSize="10px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {item.label}:
                </text>
                <text
                  x="0"
                  y="26"
                  fill="var(--ink)"
                  fontSize="12px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {item.args || item.returnValue || '—'}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Heap Synchronized Array Representation Below Tree */}
        {heapArray && heapArray.length > 0 && (
          <g className="heap-array-stage" transform="translate(40, 270)">
            <text
              x="0"
              y="-10"
              fill="var(--muted)"
              fontSize="11px"
              fontWeight="700"
              fontFamily="var(--font-mono, monospace)"
            >
              SYNCHRONIZED HEAP ARRAY:
            </text>
            {heapArray.map((cell, idx) => {
              const cellW = Math.max(28, Math.min(48, 700 / heapArray.length));
              const x = idx * cellW;
              const isMarked = cell.mark === 'current';
              const isSwapped = cell.mark === 'swapped';

              return (
                <g key={cell.index}>
                  <rect
                    x={x}
                    y="0"
                    width={cellW}
                    height="32"
                    fill={isMarked ? 'var(--accent)' : isSwapped ? 'var(--accent-2)' : 'var(--surface)'}
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + cellW / 2}
                    y="20"
                    textAnchor="middle"
                    fill={isMarked ? 'var(--on-accent, #fff)' : 'var(--ink)'}
                    fontSize="12px"
                    fontWeight="700"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {String(cell.val)}
                  </text>
                  <text
                    x={x + cellW / 2}
                    y="46"
                    textAnchor="middle"
                    fill="var(--muted)"
                    fontSize="10px"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    [{idx}]
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
