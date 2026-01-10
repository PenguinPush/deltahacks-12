import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { workflowApi } from '@services/workflowApi';
import { useWorkflowStore } from '@stores/workflowStore';
import type {
  NodeExecuteResponse,
  WorkflowExecutionResult,
  WorkflowStatus,
} from '@/types';

/**
 * Return type for useAPIExecution hook
 */
interface UseAPIExecutionReturn {
  // Node execution
  executeNode: (nodeId: string, input?: unknown) => Promise<NodeExecuteResponse>;
  isExecutingNode: boolean;
  nodeResult: NodeExecuteResponse | null;

  // Workflow execution
  executeWorkflow: (input?: unknown) => Promise<WorkflowExecutionResult>;
  isExecutingWorkflow: boolean;
  workflowResult: WorkflowExecutionResult | null;

  // Execution state
  executionStatus: WorkflowStatus;
  executionProgress: Map<string, 'pending' | 'running' | 'success' | 'error'>;

  // Controls
  pauseExecution: () => void;
  resumeExecution: () => void;
  cancelExecution: () => void;
  clearResults: () => void;

  // Error state
  error: string | null;
}

/**
 * useAPIExecution Hook
 *
 * Custom hook for executing individual nodes and full workflows.
 * Handles execution state, progress tracking, and result management.
 *
 * TODO: Add real-time execution streaming
 * TODO: Add execution breakpoints
 * TODO: Add step-by-step debugging
 * TODO: Add execution history
 */
export function useAPIExecution(): UseAPIExecutionReturn {
  const [nodeResult, setNodeResult] = useState<NodeExecuteResponse | null>(null);
  const [workflowResult, setWorkflowResult] = useState<WorkflowExecutionResult | null>(null);
  const [executionProgress, setExecutionProgress] = useState<
    Map<string, 'pending' | 'running' | 'success' | 'error'>
  >(new Map());
  const [error, setError] = useState<string | null>(null);

  // Get store actions
  const setExecutionStatus = useWorkflowStore((state) => state.setExecutionStatus);
  const executionStatus = useWorkflowStore((state) => state.executionStatus);
  const nodes = useWorkflowStore((state) => state.nodes);

  /**
   * Execute single node mutation
   */
  const nodeExecutionMutation = useMutation({
    mutationFn: async ({
      nodeId,
      input,
    }: {
      nodeId: string;
      input?: unknown;
    }): Promise<NodeExecuteResponse> => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      setExecutionProgress((prev) => new Map(prev).set(nodeId, 'running'));

      try {
        const result = await workflowApi.executeNode(nodeId, node.data, input);

        setExecutionProgress((prev) =>
          new Map(prev).set(nodeId, result.success ? 'success' : 'error')
        );

        return result;
      } catch (err) {
        setExecutionProgress((prev) => new Map(prev).set(nodeId, 'error'));
        throw err;
      }
    },
    onSuccess: (result) => {
      setNodeResult(result);
      setError(result.error || null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  /**
   * Execute workflow mutation
   */
  const workflowExecutionMutation = useMutation({
    mutationFn: async (input?: unknown): Promise<WorkflowExecutionResult> => {
      setExecutionStatus('running');

      // Initialize all nodes as pending
      const initialProgress = new Map<string, 'pending' | 'running' | 'success' | 'error'>();
      nodes.forEach((node) => {
        initialProgress.set(node.id, 'pending');
      });
      setExecutionProgress(initialProgress);

      const result = await workflowApi.executeWorkflow(input);

      // Update progress based on results
      result.nodeResults.forEach((nodeResult) => {
        setExecutionProgress((prev) =>
          new Map(prev).set(nodeResult.nodeId, nodeResult.success ? 'success' : 'error')
        );
      });

      return result;
    },
    onSuccess: (result) => {
      setWorkflowResult(result);
      setExecutionStatus(result.status);
      setError(result.error || null);
    },
    onError: (err: Error) => {
      setExecutionStatus('failed');
      setError(err.message);
    },
  });

  /**
   * Execute a single node
   */
  const executeNode = useCallback(
    async (nodeId: string, input?: unknown): Promise<NodeExecuteResponse> => {
      return nodeExecutionMutation.mutateAsync({ nodeId, input });
    },
    [nodeExecutionMutation]
  );

  /**
   * Execute the full workflow
   */
  const executeWorkflow = useCallback(
    async (input?: unknown): Promise<WorkflowExecutionResult> => {
      return workflowExecutionMutation.mutateAsync(input);
    },
    [workflowExecutionMutation]
  );

  /**
   * Pause execution
   */
  const pauseExecution = useCallback(() => {
    // TODO: Implement pause logic
    setExecutionStatus('paused');
  }, [setExecutionStatus]);

  /**
   * Resume execution
   */
  const resumeExecution = useCallback(() => {
    // TODO: Implement resume logic
    setExecutionStatus('running');
  }, [setExecutionStatus]);

  /**
   * Cancel execution
   */
  const cancelExecution = useCallback(() => {
    // TODO: Implement cancellation logic
    setExecutionStatus('idle');
    setExecutionProgress(new Map());
  }, [setExecutionStatus]);

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setNodeResult(null);
    setWorkflowResult(null);
    setError(null);
    setExecutionProgress(new Map());
    setExecutionStatus('idle');
  }, [setExecutionStatus]);

  return {
    // Node execution
    executeNode,
    isExecutingNode: nodeExecutionMutation.isPending,
    nodeResult,

    // Workflow execution
    executeWorkflow,
    isExecutingWorkflow: workflowExecutionMutation.isPending,
    workflowResult,

    // Execution state
    executionStatus,
    executionProgress,

    // Controls
    pauseExecution,
    resumeExecution,
    cancelExecution,
    clearResults,

    // Error state
    error,
  };
}

export default useAPIExecution;
