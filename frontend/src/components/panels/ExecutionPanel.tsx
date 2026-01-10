/**
 * Execution Panel - Workflow execution visualization and control
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Timer,
} from 'lucide-react';
import type { WorkflowExecution, ExecutionStep, ExecutionStatus } from '../../types/workflow';
import { executionEngine, type ExecutionEvent } from '../../services/executionEngine';

interface ExecutionPanelProps {
  workflowId: string;
  workflowName: string;
  nodes: Array<{ id: string; data: unknown }>;
  edges: Array<{ source: string; target: string }>;
  onNodeHighlight?: (nodeId: string | null) => void;
}

const statusColors: Record<ExecutionStatus, string> = {
  idle: 'text-gray-400',
  queued: 'text-blue-400',
  running: 'text-yellow-400',
  success: 'text-green-400',
  error: 'text-red-400',
  skipped: 'text-gray-500',
  paused: 'text-orange-400',
  cancelled: 'text-gray-500',
};

const statusIcons: Record<ExecutionStatus, React.ReactNode> = {
  idle: <Clock className="w-4 h-4" />,
  queued: <Clock className="w-4 h-4" />,
  running: <Activity className="w-4 h-4 animate-pulse" />,
  success: <CheckCircle className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
  skipped: <ChevronRight className="w-4 h-4" />,
  paused: <Pause className="w-4 h-4" />,
  cancelled: <Square className="w-4 h-4" />,
};

export function ExecutionPanel({
  workflowId,
  workflowName,
  nodes,
  edges,
  onNodeHighlight,
}: ExecutionPanelProps) {
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Subscribe to execution events
  useEffect(() => {
    const unsubscribe = executionEngine.subscribe((event: ExecutionEvent) => {
      if (event.executionId === currentExecution?.id) {
        const updated = executionEngine.getExecution(event.executionId);
        if (updated) {
          setCurrentExecution({ ...updated });
        }

        if (event.type === 'step_started' && event.nodeId) {
          onNodeHighlight?.(event.nodeId);
        }

        if (event.type === 'execution_completed' || event.type === 'execution_failed') {
          setIsExecuting(false);
          setIsPaused(false);
          onNodeHighlight?.(null);
          setExecutionHistory(executionEngine.getExecutionHistory(workflowId));
        }

        if (event.type === 'paused') {
          setIsPaused(true);
        }

        if (event.type === 'resumed') {
          setIsPaused(false);
        }
      }
    });

    return unsubscribe;
  }, [currentExecution?.id, workflowId, onNodeHighlight]);

  // Load execution history on mount
  useEffect(() => {
    setExecutionHistory(executionEngine.getExecutionHistory(workflowId));
  }, [workflowId]);

  // Simulated node executor
  const nodeExecutor = useCallback(async (nodeId: string, input: unknown): Promise<unknown> => {
    // Simulate API call with random delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    // Random success/failure for demo
    if (Math.random() < 0.1) {
      throw new Error('Simulated API error');
    }

    return {
      nodeId,
      timestamp: Date.now(),
      data: { processed: true, input },
    };
  }, []);

  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsExecuting(true);
    setExpandedSteps(new Set());

    const execution = await executionEngine.execute(
      workflowId,
      workflowName,
      nodes,
      edges,
      { type: 'manual' },
      nodeExecutor
    );

    setCurrentExecution(execution);
  }, [workflowId, workflowName, nodes, edges, nodeExecutor]);

  const handlePause = useCallback(() => {
    if (currentExecution) {
      executionEngine.pause(currentExecution.id);
    }
  }, [currentExecution]);

  const handleResume = useCallback(() => {
    if (currentExecution) {
      executionEngine.resume(currentExecution.id);
    }
  }, [currentExecution]);

  const handleCancel = useCallback(() => {
    if (currentExecution) {
      executionEngine.cancel(currentExecution.id);
    }
  }, [currentExecution]);

  const handleReset = useCallback(() => {
    setCurrentExecution(null);
    setExpandedSteps(new Set());
    onNodeHighlight?.(null);
  }, [onNodeHighlight]);

  const toggleStepExpanded = (nodeId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Execution
          </h3>
          <div className="flex items-center gap-2">
            {currentExecution && (
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isExecuting ? (
            <button
              onClick={handleExecute}
              disabled={nodes.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Execute
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
              >
                <Square className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Execution Status */}
      {currentExecution && (
        <div className="flex-shrink-0 p-4 border-b border-border bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className={`flex items-center gap-2 ${statusColors[currentExecution.status]}`}>
              {statusIcons[currentExecution.status]}
              <span className="font-medium capitalize">{currentExecution.status}</span>
            </span>
            {currentExecution.duration && (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <Timer className="w-3 h-3" />
                {formatDuration(currentExecution.duration)}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${currentExecution.status === 'error'
                  ? 'bg-red-500'
                  : currentExecution.status === 'success'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
              style={{
                width: `${(currentExecution.steps.filter(s => s.status === 'success' || s.status === 'error').length /
                    currentExecution.steps.length) *
                  100
                  }%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>
              {currentExecution.steps.filter(s => s.status === 'success').length} / {currentExecution.steps.length} completed
            </span>
            <span>Started: {formatTime(currentExecution.startTime)}</span>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentExecution ? (
          <div className="space-y-2">
            {currentExecution.steps.map((step) => (
              <StepItem
                key={step.nodeId}
                step={step}
                isExpanded={expandedSteps.has(step.nodeId)}
                onToggle={() => toggleStepExpanded(step.nodeId)}
                onHover={(hovering) => onNodeHighlight?.(hovering ? step.nodeId : null)}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Play className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">Click Execute to run the workflow</p>
            <p className="text-sm text-gray-600 mt-2">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} ready
            </p>
          </div>
        )}
      </div>

      {/* History */}
      {executionHistory.length > 0 && !currentExecution && (
        <div className="flex-shrink-0 border-t border-border p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Executions</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {executionHistory.slice(0, 5).map((exec) => (
              <button
                key={exec.id}
                onClick={() => setCurrentExecution(exec)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
              >
                <span className={`flex items-center gap-2 ${statusColors[exec.status]}`}>
                  {statusIcons[exec.status]}
                  <span className="capitalize">{exec.status}</span>
                </span>
                <span className="text-gray-500">{formatTime(exec.startTime)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StepItemProps {
  step: ExecutionStep;
  isExpanded: boolean;
  onToggle: () => void;
  onHover: (hovering: boolean) => void;
  formatDuration: (ms: number) => string;
}

function StepItem({ step, isExpanded, onToggle, onHover, formatDuration }: StepItemProps) {
  return (
    <div
      className={`rounded-lg border transition-all ${step.status === 'running'
          ? 'border-yellow-500/50 bg-yellow-500/10'
          : step.status === 'error'
            ? 'border-red-500/50 bg-red-500/10'
            : step.status === 'success'
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-gray-700 bg-gray-800/50'
        }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={statusColors[step.status]}>
            {statusIcons[step.status]}
          </span>
          <span className="font-medium text-white">{step.nodeName}</span>
          {step.retryCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
              Retry {step.retryCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step.duration && (
            <span className="text-xs text-gray-500">{formatDuration(step.duration)}</span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700/50">
          {/* Error */}
          {step.error && (
            <div className="mt-3 p-2 rounded bg-red-500/20 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium">{step.error.code}</p>
                  <p className="text-xs text-red-300">{step.error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input/Output */}
          {(step.input || step.output) && (
            <div className="mt-3 space-y-2">
              {step.input && Object.keys(step.input).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Input:</p>
                  <pre className="text-xs bg-black p-2 rounded overflow-x-auto text-gray-300">
                    {JSON.stringify(step.input, null, 2)}
                  </pre>
                </div>
              )}
              {step.output && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Output:</p>
                  <pre className="text-xs bg-black p-2 rounded overflow-x-auto text-gray-300">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          {step.logs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Logs:</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {step.logs.map((log, i) => (
                  <div
                    key={i}
                    className={`text-xs flex items-start gap-2 ${log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'warn'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}
                  >
                    <span className="text-gray-600 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExecutionPanel;
