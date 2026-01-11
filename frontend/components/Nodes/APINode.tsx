import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'clsx';
import type { APINodeData } from '@/types';
import { HTTP_METHOD_COLORS } from '@constants/nodeTypes';

/**
 * APINode Component
 *
 * A node representing an HTTP API call in the workflow.
 * Displays method, URL, and status information.
 *
 * TODO: Add input/output port labels
 * TODO: Add execution status indicator
 * TODO: Add error state display
 * TODO: Add quick actions menu
 * TODO: Add inline editing for URL
 */
function APINodeComponent({ id: _id, data, selected }: NodeProps<APINodeData>): JSX.Element {
  const methodColor = HTTP_METHOD_COLORS[data.method] || '#64748b';

  /**
   * Get truncated URL for display
   */
  const displayUrl = useCallback((url: string): string => {
    if (!url) return 'Enter URL...';
    if (url.length > 30) {
      return url.substring(0, 30) + '...';
    }
    return url;
  }, []);

  return (
    <div
      className={clsx(
        'workflow-node workflow-node-api',
        selected && 'selected'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!bg-gray-600 !border-gray-500"
      />

      {/* Node Header */}
      <div className="workflow-node-header">
        {/* Method Badge */}
        <span
          className="px-2 py-0.5 rounded text-xs font-bold text-white"
          style={{ backgroundColor: methodColor }}
        >
          {data.method}
        </span>
        {/* Node Label */}
        <span className="flex-1 text-sm font-medium text-gray-200 truncate">
          {data.label}
        </span>
        {/* Status Indicator */}
        {data.isExecuting && (
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        )}
        {data.lastError !== undefined && !data.isExecuting && (
          <span className="w-2 h-2 rounded-full bg-red-500" />
        )}
        {data.lastResult !== undefined && !data.isExecuting && data.lastError === undefined && (
          <span className="w-2 h-2 rounded-full bg-green-500" />
        )}
      </div>

      {/* Node Content */}
      <div className="workflow-node-content">
        {/* URL Display */}
        <div className="flex items-center gap-2 p-2 bg-black/50 rounded text-xs font-mono text-gray-400">
          <span className="truncate">{displayUrl(data.url)}</span>
        </div>

        {/* Auth Indicator */}
        {data.auth.type !== 'none' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span className="w-3 h-3">🔐</span>
            <span className="capitalize">{data.auth.type}</span>
          </div>
        )}

        {/* Headers Count */}
        {data.headers.filter((h) => h.enabled).length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {data.headers.filter((h) => h.enabled).length} header(s)
          </div>
        )}

        {/* Schema Indicator */}
        {((data.requestSchema?.length || 0) > 0 || (data.responseSchema?.length || 0) > 0) && (
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <span className="text-primary-400">{data.requestSchema?.length || 0} in</span>
            <span>/</span>
            <span className="text-green-400">{data.responseSchema?.length || 0} out</span>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="mt-2 text-xs text-gray-500 italic truncate">
            {data.description}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!bg-primary-500 !border-primary-400"
      />
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export const APINode = memo(APINodeComponent);

export default APINode;
