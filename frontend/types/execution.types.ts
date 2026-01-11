/**
 * Workflow Execution Engine Types
 */

/**
 * Node execution types - defines the role of each node in the workflow
 */
export type NodeExecutionType =
  | 'trigger'      // Webhooks, schedules, manual start - must be first
  | 'action'       // API calls that DO something (external side effects)
  | 'transform'    // Data manipulation (no external calls, sync)
  | 'control'      // Conditionals, loops, delays
  | 'output';      // Final destinations (response, storage)

/**
 * Error handling strategies for when a node fails
 */
export type ErrorStrategy =
  | 'stop'           // Halt entire workflow immediately
  | 'skip_branch'    // Skip downstream nodes, continue parallel branches
  | 'retry'          // Retry N times with exponential backoff
  | 'fallback';      // Execute fallback node instead

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'NO_TRIGGER'           // Workflow has no trigger node
  | 'MULTIPLE_TRIGGERS'    // More than one trigger node
  | 'TRIGGER_HAS_INPUT'    // Trigger node has incoming connections
  | 'CYCLE_DETECTED'       // Workflow contains a cycle
  | 'ORPHAN_NODE'          // Node is not reachable from trigger
  | 'MISSING_INPUT'        // Required input is not connected
  | 'INVALID_CONNECTION'   // Connection violates type rules
  | 'NO_OUTPUT';           // Workflow has no output/terminal node

/**
 * Node execution metadata
 */
export interface NodeExecutionMetadata {
  executionType: NodeExecutionType;
  canBeFirst: boolean;
  canBeMiddle: boolean;
  canBeLast: boolean;
  blocksExecution: boolean;  // Does this node wait for async operations?
}

/**
 * Node error configuration
 */
export interface NodeErrorConfig {
  strategy: ErrorStrategy;
  retryCount?: number;
  retryDelayMs?: number;
  retryBackoffMultiplier?: number;
  fallbackNodeId?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  nodeId?: string;
  edgeId?: string;
  fieldName?: string;
  severity: 'error' | 'warning';
}

/**
 * Workflow validation result
 */
export interface WorkflowValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Execution context - data passed between nodes during execution
 */
export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerData: unknown;
  results: Record<string, unknown>;
  activeBranches: Record<string, string>; // conditional node ID -> active branch name
  skippedNodes: Set<string>;
  startTime: number;
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string;
  status: 'success' | 'error' | 'skipped';
  output?: unknown;
  error?: Error;
  executionTimeMs: number;
  retryCount?: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'partial';
  results: Record<string, NodeExecutionResult>;
  totalExecutionTimeMs: number;
  error?: Error;
}

/**
 * Execution layer - nodes that can run in parallel
 */
export type ExecutionLayer = string[]; // Array of node IDs

/**
 * Node type execution rules
 */
export const NODE_EXECUTION_RULES: Record<NodeExecutionType, NodeExecutionMetadata> = {
  trigger: {
    executionType: 'trigger',
    canBeFirst: true,
    canBeMiddle: false,
    canBeLast: false,
    blocksExecution: true, // Waits for external event
  },
  action: {
    executionType: 'action',
    canBeFirst: true, // Can be first in manual/scheduled workflows
    canBeMiddle: true,
    canBeLast: true,
    blocksExecution: true, // HTTP calls are async
  },
  transform: {
    executionType: 'transform',
    canBeFirst: false,
    canBeMiddle: true,
    canBeLast: true,
    blocksExecution: false, // Sync operations
  },
  control: {
    executionType: 'control',
    canBeFirst: false,
    canBeMiddle: true,
    canBeLast: true,
    blocksExecution: true, // Depends on type (delay blocks, conditional doesn't)
  },
  output: {
    executionType: 'output',
    canBeFirst: false,
    canBeMiddle: true,
    canBeLast: true,
    blocksExecution: true, // Writing to storage/sending response
  },
};
