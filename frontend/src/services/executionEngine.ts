/**
 * Workflow Execution Engine
 * Client-side workflow execution with topological sorting and parallel execution
 */

import type {
  ExecutionStep,
  ExecutionLog,
  WorkflowExecution,
  TopologicalNode,
  ExecutionTrigger,
} from '../types/workflow';

// ============================================
// TOPOLOGICAL SORTING
// ============================================

interface GraphNode {
  id: string;
  data: unknown;
}

interface GraphEdge {
  source: string;
  target: string;
}

/**
 * Perform topological sort using Kahn's algorithm
 * Returns nodes grouped by execution level for parallel execution
 */
export function topologicalSort(
  nodes: GraphNode[],
  edges: GraphEdge[]
): TopologicalNode[][] {
  // Build adjacency list and in-degree count
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map<string, TopologicalNode>();

  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
    nodeMap.set(node.id, {
      id: node.id,
      dependencies: [],
      dependents: [],
      level: 0,
    });
  });

  // Build graph
  edges.forEach(edge => {
    const current = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, current + 1);
    adjacency.get(edge.source)?.push(edge.target);

    // Track dependencies
    const targetNode = nodeMap.get(edge.target);
    const sourceNode = nodeMap.get(edge.source);
    if (targetNode) targetNode.dependencies.push(edge.source);
    if (sourceNode) sourceNode.dependents.push(edge.target);
  });

  // Find all nodes with no incoming edges (level 0)
  const levels: TopologicalNode[][] = [];
  let queue: string[] = [];

  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  let level = 0;
  while (queue.length > 0) {
    const currentLevel: TopologicalNode[] = [];
    const nextQueue: string[] = [];

    for (const nodeId of queue) {
      const node = nodeMap.get(nodeId)!;
      node.level = level;
      currentLevel.push(node);

      // Reduce in-degree for all dependents
      for (const dependent of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          nextQueue.push(dependent);
        }
      }
    }

    if (currentLevel.length > 0) {
      levels.push(currentLevel);
    }
    queue = nextQueue;
    level++;
  }

  // Check for cycles
  const processedCount = levels.reduce((sum, l) => sum + l.length, 0);
  if (processedCount !== nodes.length) {
    console.warn('Cycle detected in workflow graph');
  }

  return levels;
}

// ============================================
// EXECUTION ENGINE CLASS
// ============================================

export type ExecutionEventType =
  | 'execution_started'
  | 'execution_completed'
  | 'execution_failed'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'step_retrying'
  | 'log_added'
  | 'paused'
  | 'resumed'
  | 'cancelled';

export interface ExecutionEvent {
  type: ExecutionEventType;
  executionId: string;
  timestamp: number;
  nodeId?: string;
  data?: unknown;
}

type ExecutionListener = (event: ExecutionEvent) => void;

export class WorkflowExecutionEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private listeners: Set<ExecutionListener> = new Set();
  private abortControllers: Map<string, AbortController> = new Map();
  private pausedExecutions: Set<string> = new Set();

  // Configuration
  private maxRetries = 3;
  private retryDelay = 1000;
  private stepTimeout = 30000;

  constructor(config?: {
    maxRetries?: number;
    retryDelay?: number;
    stepTimeout?: number;
  }) {
    if (config) {
      this.maxRetries = config.maxRetries ?? this.maxRetries;
      this.retryDelay = config.retryDelay ?? this.retryDelay;
      this.stepTimeout = config.stepTimeout ?? this.stepTimeout;
    }
  }

  /**
   * Subscribe to execution events
   */
  subscribe(listener: ExecutionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ExecutionEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflowId: string,
    workflowName: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
    trigger: ExecutionTrigger,
    nodeExecutor: (nodeId: string, input: unknown) => Promise<unknown>
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    this.abortControllers.set(executionId, abortController);

    // Initialize execution
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowName,
      status: 'running',
      startTime: Date.now(),
      steps: nodes.map(node => ({
        nodeId: node.id,
        nodeName: (node.data as { label?: string })?.label || node.id,
        status: 'queued',
        retryCount: 0,
        logs: [],
      })),
      trigger,
    };

    this.executions.set(executionId, execution);
    this.emit({
      type: 'execution_started',
      executionId,
      timestamp: Date.now(),
    });

    try {
      // Get execution order
      const levels = topologicalSort(nodes, edges);
      const nodeOutputs = new Map<string, unknown>();

      // Execute level by level (parallel within each level)
      for (const level of levels) {
        if (abortController.signal.aborted) {
          throw new Error('Execution cancelled');
        }

        // Wait if paused
        while (this.pausedExecutions.has(executionId)) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (abortController.signal.aborted) {
            throw new Error('Execution cancelled');
          }
        }

        // Execute all nodes in this level in parallel
        const levelPromises = level.map(async (topoNode) => {
          const step = execution.steps.find(s => s.nodeId === topoNode.id)!;

          // Gather inputs from dependencies
          const input: Record<string, unknown> = {};
          for (const depId of topoNode.dependencies) {
            input[depId] = nodeOutputs.get(depId);
          }

          await this.executeStep(
            executionId,
            step,
            input,
            nodeExecutor,
            nodeOutputs,
            abortController.signal
          );
        });

        await Promise.all(levelPromises);

        // Check if any step failed
        const failedStep = execution.steps.find(s => s.status === 'error');
        if (failedStep) {
          throw new Error(`Step ${failedStep.nodeName} failed`);
        }
      }

      // Mark execution as successful
      execution.status = 'success';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit({
        type: 'execution_completed',
        executionId,
        timestamp: Date.now(),
      });

    } catch (error) {
      execution.status = 'error';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit({
        type: 'execution_failed',
        executionId,
        timestamp: Date.now(),
        data: { error: (error as Error).message },
      });
    } finally {
      this.abortControllers.delete(executionId);
      this.pausedExecutions.delete(executionId);
    }

    return execution;
  }

  private async executeStep(
    executionId: string,
    step: ExecutionStep,
    input: unknown,
    nodeExecutor: (nodeId: string, input: unknown) => Promise<unknown>,
    outputs: Map<string, unknown>,
    signal: AbortSignal
  ): Promise<void> {
    step.status = 'running';
    step.startTime = Date.now();
    step.input = input as Record<string, unknown>;

    this.addLog(step, 'info', `Starting execution`);
    this.emit({
      type: 'step_started',
      executionId,
      timestamp: Date.now(),
      nodeId: step.nodeId,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (signal.aborted) {
        step.status = 'cancelled';
        return;
      }

      try {
        if (attempt > 0) {
          this.addLog(step, 'info', `Retry attempt ${attempt}`);
          this.emit({
            type: 'step_retrying',
            executionId,
            timestamp: Date.now(),
            nodeId: step.nodeId,
            data: { attempt },
          });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }

        // Execute with timeout
        const result = await Promise.race([
          nodeExecutor(step.nodeId, input),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Step timeout')), this.stepTimeout)
          ),
        ]);

        // Success
        step.status = 'success';
        step.endTime = Date.now();
        step.duration = step.endTime - step.startTime;
        step.output = result as Record<string, unknown>;
        step.retryCount = attempt;

        outputs.set(step.nodeId, result);

        this.addLog(step, 'info', `Completed in ${step.duration}ms`);
        this.emit({
          type: 'step_completed',
          executionId,
          timestamp: Date.now(),
          nodeId: step.nodeId,
          data: { duration: step.duration },
        });

        return;
      } catch (error) {
        lastError = error as Error;
        this.addLog(step, 'error', `Error: ${lastError.message}`);
      }
    }

    // All retries exhausted
    step.status = 'error';
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    step.error = {
      code: 'EXECUTION_FAILED',
      message: lastError?.message || 'Unknown error',
      retryable: false,
    };

    this.emit({
      type: 'step_failed',
      executionId,
      timestamp: Date.now(),
      nodeId: step.nodeId,
      data: { error: step.error },
    });
  }

  private addLog(step: ExecutionStep, level: ExecutionLog['level'], message: string): void {
    step.logs.push({
      timestamp: Date.now(),
      level,
      message,
    });
  }

  /**
   * Pause an execution
   */
  pause(executionId: string): void {
    if (this.executions.has(executionId)) {
      this.pausedExecutions.add(executionId);
      this.emit({
        type: 'paused',
        executionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Resume a paused execution
   */
  resume(executionId: string): void {
    if (this.pausedExecutions.has(executionId)) {
      this.pausedExecutions.delete(executionId);
      this.emit({
        type: 'resumed',
        executionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Cancel an execution
   */
  cancel(executionId: string): void {
    const controller = this.abortControllers.get(executionId);
    if (controller) {
      controller.abort();
      this.emit({
        type: 'cancelled',
        executionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get execution history for a workflow
   */
  getExecutionHistory(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executions.clear();
  }
}

// Export singleton instance
export const executionEngine = new WorkflowExecutionEngine();
