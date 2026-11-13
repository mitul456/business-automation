import React, { useState } from 'react';
import { cn } from './utils';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface AreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 200,
  color = '#4f46e5', // Indigo-600
  secondaryColor = '#94a3b8',
  showGrid = true,
  className,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const getX = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
  const getY = (val: number) => height - padding - (val / maxValue) * chartHeight;

  // Build SVG Path
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${getX(data.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {showGrid && (
          <>
            <line
              x1={padding}
              y1={padding}
              x2={width - padding}
              y2={padding}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={height / 2}
              x2={width - padding}
              y2={height / 2}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#e2e8f0"
            />
          </>
        )}

        {/* Fill Area */}
        <path d={areaD} fill="url(#area-gradient)" />

        {/* Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & Interaction */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoverIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <line
                  x1={cx}
                  y1={padding}
                  x2={cx}
                  y2={height - padding}
                  stroke="#cbd5e1"
                  strokeDasharray="2 2"
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill="#ffffff"
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute pointer-events-none rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg transition-transform"
          style={{
            left: `${(hoverIndex / (data.length - 1)) * 90}%`,
            top: '8px',
          }}
        >
          <div className="font-medium text-slate-300">{data[hoverIndex].label}</div>
          <div className="text-sm font-bold text-white">
            {data[hoverIndex].value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  color = '#4f46e5',
  className,
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('w-full flex items-end gap-2 pt-6', className)} style={{ height }}>
      {data.map((d, i) => {
        const percentage = Math.round((d.value / maxValue) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              {d.value.toLocaleString()}
            </div>
            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-85"
              style={{
                height: `${Math.max(percentage, 4)}%`,
                backgroundColor: color,
              }}
            />
            <div className="text-[11px] text-slate-500 truncate w-full text-center">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
