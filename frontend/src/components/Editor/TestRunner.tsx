import { useState, useCallback } from 'react';
import { Button, Loader } from '@components/common';
import type { NodeExecuteResponse, WorkflowExecutionResult } from '@/types';

/**
 * Props for TestRunner component
 */
interface TestRunnerProps {
  /** Node ID to test (for single node testing) */
  nodeId?: string;
  /** Workflow ID to test (for full workflow testing) */
  workflowId?: string;
  /** Called to execute a single node */
  onExecuteNode?: (nodeId: string, input: unknown) => Promise<NodeExecuteResponse>;
  /** Called to execute the full workflow */
  onExecuteWorkflow?: (input: unknown) => Promise<WorkflowExecutionResult>;
  /** Whether execution is in progress */
  isExecuting?: boolean;
}

/**
 * Execution result display type
 */
type ResultType = 'node' | 'workflow';

/**
 * TestRunner Component
 *
 * Panel for testing individual nodes or full workflows.
 * Provides input editor, execution controls, and result display.
 *
 * TODO: Add input validation against schema
 * TODO: Add result comparison/diffing
 * TODO: Add request/response history
 * TODO: Add export results to file
 * TODO: Add cURL command generation
 * TODO: Add environment variable support
 */
export function TestRunner({
  nodeId,
  workflowId,
  onExecuteNode,
  onExecuteWorkflow,
  isExecuting = false,
}: TestRunnerProps): JSX.Element {
  const [input, setInput] = useState('{}');
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);
  const [resultType, setResultType] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  /**
   * Validate and parse input JSON
   */
  const parseInput = useCallback((): unknown | null => {
    try {
      const parsed = JSON.parse(input);
      setInputError(null);
      return parsed;
    } catch {
      setInputError('Invalid JSON');
      return null;
    }
  }, [input]);

  /**
   * Execute single node test
   */
  const handleTestNode = useCallback(async () => {
    if (!nodeId || !onExecuteNode) return;

    const parsedInput = parseInput();
    if (parsedInput === null) return;

    setError(null);
    setResult(null);
    setDuration(null);

    try {
      const startTime = Date.now();
      const response = await onExecuteNode(nodeId, parsedInput);
      setDuration(Date.now() - startTime);

      if (response.success) {
        setResult(response.output);
        setResultType('node');
      } else {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    }
  }, [nodeId, onExecuteNode, parseInput]);

  /**
   * Execute full workflow test
   */
  const handleTestWorkflow = useCallback(async () => {
    if (!workflowId || !onExecuteWorkflow) return;

    const parsedInput = parseInput();
    if (parsedInput === null) return;

    setError(null);
    setResult(null);
    setDuration(null);

    try {
      const response = await onExecuteWorkflow(parsedInput);
      setDuration(
        response.completedAt
          ? new Date(response.completedAt).getTime() - new Date(response.startedAt).getTime()
          : null
      );

      if (response.status === 'completed') {
        setResult(response);
        setResultType('workflow');
      } else {
        setError(response.error || 'Workflow failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    }
  }, [workflowId, onExecuteWorkflow, parseInput]);

  /**
   * Format result for display
   */
  const formatResult = useCallback((data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, []);

  return (
    <div className="flex flex-col h-full border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">Test Runner</span>
        <div className="flex items-center gap-2">
          {duration !== null && (
            <span className="text-xs text-gray-500">{duration}ms</span>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="p-3 border-b border-gray-700">
        <label className="block text-xs font-medium text-gray-400 mb-1">Input Data</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "value"}'
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                     text-sm font-mono text-gray-200 resize-none"
        />
        {inputError && <p className="mt-1 text-xs text-red-400">{inputError}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        {nodeId && onExecuteNode && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleTestNode}
            disabled={isExecuting}
          >
            {isExecuting ? <Loader size="sm" /> : 'Test Node'}
          </Button>
        )}
        {workflowId && onExecuteWorkflow && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestWorkflow}
            disabled={isExecuting}
          >
            {isExecuting ? <Loader size="sm" /> : 'Run Workflow'}
          </Button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setError(null);
            setDuration(null);
          }}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      </div>

      {/* Result Section */}
      <div className="flex-1 overflow-auto p-3 bg-gray-900">
        {isExecuting && (
          <div className="flex items-center justify-center h-full">
            <Loader size="lg" />
          </div>
        )}

        {error && !isExecuting && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {result !== null && !isExecuting && !error && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              {resultType === 'workflow' ? 'Workflow Result' : 'Node Output'}
            </label>
            <pre className="p-3 bg-gray-800 rounded-md text-xs font-mono text-gray-300 overflow-auto max-h-64">
              {formatResult(result)}
            </pre>
          </div>
        )}

        {!result && !error && !isExecuting && (
          <p className="text-center text-sm text-gray-500 py-8">
            Run a test to see results here
          </p>
        )}
      </div>
    </div>
  );
}

export default TestRunner;
