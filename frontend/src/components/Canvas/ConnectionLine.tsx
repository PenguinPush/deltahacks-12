import { type ConnectionLineComponentProps, getSmoothStepPath } from 'reactflow';

/**
 * ConnectionLine Component
 *
 * Custom connection line rendered while the user is creating a new edge.
 * Provides visual feedback for the connection being created.
 *
 * TODO: Add validation styling (valid/invalid connection)
 * TODO: Add data type compatibility indicator
 * TODO: Add animation effect
 */
export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps): JSX.Element {
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 8,
  });

  return (
    <g>
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={6}
        strokeOpacity={0.3}
        className="pointer-events-none"
      />
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="8 4"
        className="pointer-events-none animate-flow-line"
      />
      {/* Target indicator */}
      <circle
        cx={toX}
        cy={toY}
        r={6}
        fill="#3b82f6"
        className="pointer-events-none"
      />
    </g>
  );
}

export default ConnectionLine;
