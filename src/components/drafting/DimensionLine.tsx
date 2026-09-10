import React from 'react';

interface DimensionLineProps {
  x1: number; y1: number; x2: number; y2: number;
  offset?: number;
  text: string;
  color?: string;
  fontSize?: number;
}

/** Civil-engineering dimensioning: extension lines, arrows, centered text. */
export const DimensionLine: React.FC<DimensionLineProps> = ({
  x1, y1, x2, y2, offset = 14, text, color = '#94a3b8', fontSize = 10,
}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ax1 = x1 + nx * offset;
  const ay1 = y1 + ny * offset;
  const ax2 = x2 + nx * offset;
  const ay2 = y2 + ny * offset;
  const mx = (ax1 + ax2) / 2;
  const my = (ay1 + ay2) / 2;
  const id = React.useId().replace(/:/g, '');
  const ex = 4; // extension overshoot
  return (
    <g stroke={color} strokeWidth={0.8}>
      <defs>
        <marker id={`a-${id}`} markerWidth={7} markerHeight={7} refX={5} refY={2.5} orient="auto">
          <path d="M0,0 L6,2.5 L0,5" fill="none" stroke={color} strokeWidth={1} />
        </marker>
      </defs>
      {/* extension lines */}
      <line x1={x1 + nx * ex} y1={y1 + ny * ex} x2={ax1 + nx * ex} y2={ay1 + ny * ex} opacity={0.7} />
      <line x1={x2 + nx * ex} y1={y2 + ny * ex} x2={ax2 + nx * ex} y2={ay2 + ny * ex} opacity={0.7} />
      {/* dimension line with arrows */}
      <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} markerStart={`url(#a-${id})`} markerEnd={`url(#a-${id})`} />
      <text
        x={mx} y={my} textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize} fill={color} stroke="none"
        style={{ paintOrder: 'stroke', strokeWidth: 3 }}
        className="fill-slate-600 dark:fill-slate-300"
      >
        {text}
      </text>
    </g>
  );
};
