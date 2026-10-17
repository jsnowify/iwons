"use client";

import React from 'react';
import { GraphStep, GraphNodeMark, GraphEdgeMark } from '../core/types';

interface GraphEngineProps {
  step: GraphStep;
}

export function GraphEngine({ step }: GraphEngineProps) {
  const { nodes, edges, queueOrStack, visitedOrder } = step.graph;

  if (nodes.length === 0) {
    return (
      <div className="engine-empty-message">
        <p>Graph is empty. No vertices to display.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 360;
  const nodeRadius = 22;

  // Node position map
  const nodePos = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, idx) => {
    // If coords are not provided, assign circular positions
    if (n.x !== undefined && n.y !== undefined) {
      nodePos.set(n.id, { x: n.x, y: n.y });
    } else {
      const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
      nodePos.set(n.id, {
        x: Math.round(260 + 130 * Math.cos(angle)),
        y: Math.round(180 + 120 * Math.sin(angle)),
      });
    }
  });

  const getNodeStyles = (mark?: GraphNodeMark) => {
    switch (mark) {
      case 'current':
        return { fill: 'var(--accent)', stroke: 'var(--ink)', strokeWidth: 3, textColor: 'var(--on-accent, #fff)' };
      case 'frontier':
        return { fill: 'var(--accent-2)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'visited':
      case 'finished':
        return { fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
      case 'path':
        return { fill: 'var(--accent-3, #d97706)', stroke: 'var(--ink)', strokeWidth: 3, textColor: '#fff' };
      default:
        return { fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 2, textColor: 'var(--ink)' };
    }
  };

  const getEdgeStyles = (mark?: GraphEdgeMark) => {
    switch (mark) {
      case 'active':
        return { stroke: 'var(--accent)', strokeWidth: 3.5, opacity: 1 };
      case 'tree':
      case 'in-path':
        return { stroke: 'var(--ink)', strokeWidth: 3, opacity: 1 };
      case 'visited':
        return { stroke: 'var(--border-dim, #999)', strokeWidth: 1.5, strokeDasharray: '3 2', opacity: 0.6 };
      default:
        return { stroke: 'var(--ink)', strokeWidth: 1.5, opacity: 0.5 };
    }
  };

  return (
    <div className="visualizer-engine-container graph-engine">
      <div className="graph-workbench-layout">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="engine-svg-stage graph-svg"
          role="img"
          aria-label="Graph visualization"
        >
          <defs>
            <marker
              id="graph-arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="var(--ink)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, idx) => {
            const p1 = nodePos.get(e.source);
            const p2 = nodePos.get(e.target);
            if (!p1 || !p2) return null;

            const edgeStyle = getEdgeStyles(e.mark);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={idx} className="graph-edge-group">
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={edgeStyle.stroke}
                  strokeWidth={edgeStyle.strokeWidth}
                  strokeDasharray={edgeStyle.strokeDasharray}
                  opacity={edgeStyle.opacity}
                  markerEnd={e.directed ? 'url(#graph-arrowhead)' : undefined}
                />
                {e.weight !== undefined && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-12"
                      y="-10"
                      width="24"
                      height="16"
                      fill="var(--surface)"
                      stroke="var(--ink)"
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="var(--ink)"
                      fontSize="10px"
                      fontWeight="700"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {String(e.weight)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const pos = nodePos.get(n.id);
            if (!pos) return null;
            const style = getNodeStyles(n.mark);

            return (
              <g key={n.id} className="graph-node-group" data-mark={n.mark}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  className="graph-node-circle"
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fill={style.textColor}
                  fontSize="14px"
                  fontWeight="700"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.label}
                </text>

                {/* Distance badge above or below node */}
                {n.distance && (
                  <text
                    x={pos.x}
                    y={pos.y - nodeRadius - 6}
                    textAnchor="middle"
                    fill="var(--accent)"
                    fontSize="10px"
                    fontWeight="700"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {n.distance}
                  </text>
                )}
              </g>
            );
          })}

          {/* Queue or Stack Container Inside SVG (Right Side) */}
          {queueOrStack && (
            <g className="queue-stack-stage" transform="translate(560, 24)">
              <rect
                x="0"
                y="0"
                width="210"
                height="310"
                fill="var(--surface)"
                stroke="var(--ink)"
                strokeWidth="2"
                rx="4"
              />
              <rect x="0" y="0" width="210" height="28" fill="var(--ink)" rx="4 4 0 0" />
              <text
                x="12"
                y="19"
                fill="var(--surface)"
                fontSize="11px"
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
              >
                {queueOrStack.type.toUpperCase()}
              </text>

              {queueOrStack.items.length === 0 ? (
                <text
                  x="105"
                  y="70"
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="12px"
                  fontFamily="var(--font-mono, monospace)"
                >
                  (empty)
                </text>
              ) : (
                queueOrStack.items.slice(0, 7).map((item, i) => (
                  <g key={i} transform={`translate(16, ${42 + i * 36})`}>
                    <rect
                      x="0"
                      y="0"
                      width="178"
                      height="28"
                      fill="var(--accent-soft)"
                      stroke="var(--ink)"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x="14"
                      y="18"
                      fill="var(--ink)"
                      fontSize="12px"
                      fontWeight="700"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {item}
                    </text>
                  </g>
                ))
              )}
            </g>
          )}
        </svg>

        {/* Visited Order Strip Below */}
        {visitedOrder && visitedOrder.length > 0 && (
          <div className="graph-visited-strip">
            <span className="strip-label">Visited order:</span>
            <div className="strip-pills">
              {visitedOrder.map((id, i) => (
                <React.Fragment key={id}>
                  <span className="visited-pill">{id}</span>
                  {i < visitedOrder.length - 1 && <span className="strip-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
