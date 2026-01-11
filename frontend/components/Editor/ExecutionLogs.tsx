import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@components/common';
import type { NodeExecutionResult } from '@/types';

/**
 * Log entry type
 */
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  nodeId?: string;
  nodeName?: string;
  message: string;
  details?: unknown;
}

/**
 * Props for ExecutionLogs component
 */
interface ExecutionLogsProps {
  logs?: LogEntry[];
  nodeResults?: NodeExecutionResult[];
  isExecuting?: boolean;
  onClear?: () => void;
}

const LEVEL_COLORS = {
  info: 'text-[#3B82F6]',
  success: 'text-[#22C55E]',
  warning: 'text-[#EAB308]',
  error: 'text-[#EF4444]',
};

const LEVEL_BG = {
  info: 'bg-[#3B82F6]/10',
  success: 'bg-[#22C55E]/10',
  warning: 'bg-[#EAB308]/10',
  error: 'bg-[#EF4444]/10',
};

/**
 * ExecutionLogs Component
 *
 * Displays execution logs for workflow runs.
 *
 * TODO: Add log filtering by level
 * TODO: Add log search
 * TODO: Add log export
 */
export function ExecutionLogs({
  logs = [],
  nodeResults = [],
  isExecuting = false,
  onClear,
}: ExecutionLogsProps): JSX.Element {
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Convert node results to logs
  const allLogs: LogEntry[] = [
    ...logs,
    ...nodeResults.map((result): LogEntry => ({
      id: `result-${result.nodeId}-${result.timestamp}`,
      timestamp: result.timestamp,
      level: result.success ? 'success' : 'error',
      nodeId: result.nodeId,
      message: result.success ? `Completed in ${result.duration}ms` : result.error || 'Failed',
      details: result.output,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allLogs.length, autoScroll]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Execution Logs</span>
          {isExecuting && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-[#6A6A6A]">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="w-3 h-3" />
            Auto-scroll
          </label>
          {onClear && <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {allLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#6A6A6A]">No logs yet. Execute a workflow to see logs.</div>
        ) : (
          <div className="p-2 space-y-1">
            {allLogs.map((log) => (
              <div key={log.id} className={`p-2 rounded ${LEVEL_BG[log.level]}`}>
                <div className="flex items-start gap-2">
                  <span className="text-[#6A6A6A] shrink-0">{formatTime(log.timestamp)}</span>
                  <span className={`shrink-0 uppercase font-medium ${LEVEL_COLORS[log.level]}`}>[{log.level}]</span>
                  {log.nodeName && <span className="text-[#A0A0A0]">[{log.nodeName}]</span>}
                  <span className="text-white flex-1">{log.message}</span>
                  {log.details !== undefined && (
                    <button onClick={() => toggleExpand(log.id)} className="text-[#6A6A6A] hover:text-white">
                      {expandedLogs.has(log.id) ? '▼' : '▶'}
                    </button>
                  )}
                </div>
                {log.details !== undefined && expandedLogs.has(log.id) && (
                  <pre className="mt-2 p-2 bg-[#0A0A0A] rounded text-[#A0A0A0] overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionLogs;
