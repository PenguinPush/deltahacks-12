import type { Edge, Viewport } from 'reactflow';
import type { WorkflowNode } from './node.types';

/**
 * Workflow execution status
 */
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

/**
 * Edge execution state
 */
export type EdgeStatus = 'idle' | 'active' | 'success' | 'error';

/**
 * Custom edge data with execution state
 */
export interface WorkflowEdgeData {
  status?: EdgeStatus;
  label?: string;
  animated?: boolean;
  dataPreview?: unknown;
}

/**
 * Workflow edge extending React Flow's Edge type
 */
export type WorkflowEdge = Edge<WorkflowEdgeData>;

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Workflow definition (for saving/loading)
 */
export interface WorkflowDefinition {
  metadata: WorkflowMetadata;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: Viewport;
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  timestamp: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  nodeResults: NodeExecutionResult[];
  finalOutput?: unknown;
  error?: string;
}

/**
 * Execution context passed between nodes
 */
export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  credentials: Record<string, string>;
}

/**
 * Workflow state for the store
 */
export interface WorkflowState {
  // Workflow data
  metadata: WorkflowMetadata | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: Viewport;

  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isModified: boolean;

  // Execution state
  executionStatus: WorkflowStatus;
  executionResult: WorkflowExecutionResult | null;
  isExecuting: boolean;
}

/**
 * Workflow store actions
 */
export interface WorkflowActions {
  // Node operations
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Edge operations
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (edgeId: string, data: Partial<WorkflowEdge>) => void;
  removeEdge: (edgeId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  // Viewport
  setViewport: (viewport: Viewport) => void;

  // Workflow operations
  loadWorkflow: (definition: WorkflowDefinition) => void;
  saveWorkflow: () => WorkflowDefinition;
  clearWorkflow: () => void;
  updateMetadata: (metadata: Partial<WorkflowMetadata>) => void;

  // Execution
  setExecutionStatus: (status: WorkflowStatus) => void;
  setExecutionResult: (result: WorkflowExecutionResult | null) => void;

  // History (undo/redo) - TODO
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/**
 * Complete workflow store type
 */
export type WorkflowStore = WorkflowState & WorkflowActions;

/**
 * Workflow list item (for listing workflows)
 */
export interface WorkflowListItem {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  status?: WorkflowStatus;
  nodeCount: number;
}

/**
 * Workflow validation result
 */
export interface WorkflowValidation {
  isValid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

/**
 * Validation error
 */
export interface WorkflowValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  field?: string;
}

/**
 * Validation warning
 */
export interface WorkflowValidationWarning {
  nodeId?: string;
  message: string;
  suggestion?: string;
}
