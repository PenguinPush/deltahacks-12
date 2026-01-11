import { memo } from 'react';
import { Handle, Position, type HandleProps } from 'reactflow';
import clsx from 'clsx';
import type { HandleDataType } from '@/types';

/**
 * Props for NodeHandle component
 */
interface NodeHandleProps extends Omit<HandleProps, 'position'> {
  /** Handle position on the node */
  position: 'left' | 'right' | 'top' | 'bottom';
  /** Data type this handle accepts/provides */
  dataType?: HandleDataType;
  /** Label to display next to the handle */
  label?: string;
  /** Whether this handle is required for connections */
  required?: boolean;
  /** Whether the handle is currently connected */
  isConnected?: boolean;
}

/**
 * Position mapping
 */
const POSITION_MAP: Record<string, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

/**
 * Data type colors
 */
const DATA_TYPE_COLORS: Record<HandleDataType, string> = {
  any: '#64748b',
  string: '#22c55e',
  number: '#3b82f6',
  boolean: '#f59e0b',
  object: '#8b5cf6',
  array: '#ec4899',
};

/**
 * NodeHandle Component
 *
 * Custom handle component for workflow nodes.
 * Displays data type information and connection state.
 *
 * TODO: Add hover tooltip with data type info
 * TODO: Add validation for compatible connections
 * TODO: Add data preview on hover when connected
 */
function NodeHandleComponent({
  position,
  dataType = 'any',
  label,
  required = false,
  isConnected = false,
  type,
  id,
  ...handleProps
}: NodeHandleProps): JSX.Element {
  const color = DATA_TYPE_COLORS[dataType];
  const reactFlowPosition = POSITION_MAP[position] || Position.Left;
  const isInput = type === 'target';

  return (
    <div
      className={clsx(
        'absolute flex items-center gap-1',
        position === 'left' && '-left-1',
        position === 'right' && '-right-1',
        position === 'top' && '-top-1',
        position === 'bottom' && '-bottom-1',
        (position === 'left' || position === 'right') && 'top-1/2 -translate-y-1/2',
        (position === 'top' || position === 'bottom') && 'left-1/2 -translate-x-1/2',
        isInput ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Handle
        type={type}
        position={reactFlowPosition}
        id={id}
        {...handleProps}
        className={clsx(
          'relative !w-3 !h-3 !border-2 !rounded-full transition-all',
          isConnected && '!scale-110'
        )}
        style={{
          backgroundColor: isConnected ? color : '#1f2937',
          borderColor: color,
        }}
      />

      {label && (
        <span
          className={clsx(
            'text-xs text-gray-500 whitespace-nowrap',
            required && 'font-medium'
          )}
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export const NodeHandle = memo(NodeHandleComponent);

export default NodeHandle;
