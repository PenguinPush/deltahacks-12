import type { Node, NodeProps } from 'reactflow';

/**
 * Node Types
 * Defines the types of nodes available in the workflow builder
 */
export type NodeType = 'api' | 'transform' | 'condition' | 'input' | 'output';

/**
 * HTTP Methods supported by API nodes
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Authentication types for API calls
 */
export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic' | 'oauth2';

/**
 * Data type for node handles (inputs/outputs)
 */
export type HandleDataType = 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * Schema field definition for API request/response
 */
export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

/**
 * Field mapping for connecting upstream outputs to inputs
 */
export interface APIFieldMapping {
  sourceNodeId: string;
  sourceField: string;
  staticValue?: string;
  template?: string;
}

/**
 * Handle definition for node inputs/outputs
 */
export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  dataType: HandleDataType;
  label: string;
  required?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Header configuration for API requests
 */
export interface HeaderConfig {
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * Query parameter configuration
 */
export interface QueryParamConfig {
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: AuthType;
  credentialId?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
}

/**
 * API Node specific data
 */
export interface APINodeData {
  label: string;
  nodeType: 'api';
  executionType?: 'action'; // Execution engine metadata
  method: HttpMethod;
  url: string;
  headers: HeaderConfig[];
  queryParams: QueryParamConfig[];
  body?: string;
  bodyType?: 'json' | 'form-data' | 'raw';
  auth: AuthConfig;
  timeout?: number;
  retryCount?: number;
  description?: string;

  // Schema definitions
  requestSchema: SchemaField[];
  responseSchema: SchemaField[];

  // Field mappings (how request fields get values from upstream nodes)
  fieldMappings: Record<string, APIFieldMapping>;

  // Execution state
  lastResult?: unknown;
  lastError?: string;
  isExecuting?: boolean;
}

/**
 * Transform Node specific data
 */
export interface TransformNodeData {
  label: string;
  nodeType: 'transform';
  executionType?: 'transform'; // Execution engine metadata
  transformType: 'map' | 'filter' | 'reduce' | 'custom';
  expression?: string;
  mappings?: FieldMapping[];
  description?: string;
}

/**
 * Field mapping for transform nodes
 */
export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transform?: string;
}

/**
 * Condition Node specific data
 */
export interface ConditionNodeData {
  label: string;
  nodeType: 'condition';
  executionType?: 'control'; // Execution engine metadata
  conditions: ConditionRule[];
  defaultOutput?: string;
  description?: string;
}

/**
 * Condition rule definition
 */
export interface ConditionRule {
  id: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'regex';
  value: string;
  outputHandle: string;
}

/**
 * Input Node specific data
 */
export interface InputNodeData {
  label: string;
  nodeType: 'input';
  executionType?: 'trigger'; // Execution engine metadata
  inputType: 'manual' | 'webhook' | 'schedule';
  schema?: Record<string, unknown>;
  defaultValue?: unknown;
  description?: string;
}

/**
 * Output Node specific data
 */
export interface OutputNodeData {
  label: string;
  nodeType: 'output';
  executionType?: 'output'; // Execution engine metadata
  outputType: 'response' | 'webhook' | 'log';
  format?: 'json' | 'xml' | 'text';
  description?: string;
}

/**
 * Union type for all node data types
 */
export type WorkflowNodeData =
  | APINodeData
  | TransformNodeData
  | ConditionNodeData
  | InputNodeData
  | OutputNodeData;

/**
 * Workflow node extending React Flow's Node type
 */
export type WorkflowNode = Node<WorkflowNodeData>;

/**
 * Props for custom node components
 */
export type WorkflowNodeProps = NodeProps<WorkflowNodeData>;

/**
 * Node template for the palette
 */
export interface NodeTemplate {
  id: string;
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  defaultData: Partial<WorkflowNodeData>;
  handles: NodeHandle[];
  category: string;
}

/**
 * Node category for organizing the palette
 */
export interface NodeCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}
