/**
 * Workflow Types - Core types for workflow execution and management
 */

// ============================================
// EXECUTION ENGINE TYPES
// ============================================

export type ExecutionStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped'
  | 'paused'
  | 'cancelled';

export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: ExecutionError;
  retryCount: number;
  logs: ExecutionLog[];
}

export interface ExecutionError {
  code: string;
  message: string;
  stack?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: ExecutionStep[];
  trigger: ExecutionTrigger;
  metadata?: Record<string, unknown>;
}

export interface ExecutionTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'api';
  source?: string;
  payload?: unknown;
}

export interface TopologicalNode {
  id: string;
  dependencies: string[];
  dependents: string[];
  level: number; // For parallel execution grouping
}

// ============================================
// CREDENTIAL MANAGEMENT TYPES
// ============================================

export type CredentialType =
  | 'api_key'
  | 'oauth2'
  | 'basic_auth'
  | 'bearer_token'
  | 'custom';

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  serviceId: string; // e.g., 'stripe', 'sendgrid'
  serviceName: string;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  isValid?: boolean;
  expiresAt?: number;
  // Encrypted data stored separately
}

export interface CredentialData {
  // API Key
  apiKey?: string;
  // OAuth2
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string[];
  // Basic Auth
  username?: string;
  password?: string;
  // Custom fields
  custom?: Record<string, string>;
}

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  pkce?: boolean;
}

// ============================================
// SCHEMA DETECTION TYPES
// ============================================

export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'date'
  | 'email'
  | 'url'
  | 'uuid';

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
  required: boolean;
  description?: string;
  example?: unknown;
  format?: string;
  enum?: unknown[];
  items?: SchemaField; // For arrays
  properties?: SchemaField[]; // For objects
  nullable?: boolean;
}

export interface APISchema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  sampleData?: unknown;
  detectedFrom?: 'sample' | 'openapi' | 'manual';
  confidence?: number; // 0-100
}

export interface FieldMappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number; // 0-100
  reason: string;
  transformation?: string;
}

// ============================================
// MOCK API TYPES
// ============================================

export interface MockEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  fullUrl: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  delay?: number; // ms
  enabled: boolean;
  scenarios: MockScenario[];
}

export interface MockScenario {
  id: string;
  name: string;
  condition?: MockCondition;
  responseStatus: number;
  responseBody: unknown;
  probability?: number; // For random scenarios
}

export interface MockCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists';
  value?: string;
}

export interface FakeDataConfig {
  type: 'name' | 'email' | 'phone' | 'address' | 'uuid' | 'date' | 'number' | 'boolean' | 'custom';
  options?: {
    min?: number;
    max?: number;
    format?: string;
    locale?: string;
  };
}

// ============================================
// DATA TRANSFORMATION TYPES
// ============================================

export type TransformerType =
  | 'string_format'
  | 'number_format'
  | 'date_format'
  | 'json_path'
  | 'template'
  | 'math'
  | 'conditional'
  | 'array_map'
  | 'array_filter'
  | 'custom_js';

export interface Transformer {
  id: string;
  type: TransformerType;
  name: string;
  config: TransformerConfig;
}

export interface TransformerConfig {
  // String operations
  stringOperation?: 'uppercase' | 'lowercase' | 'trim' | 'replace' | 'split' | 'join' | 'substring';
  pattern?: string;
  replacement?: string;

  // Number operations
  numberOperation?: 'round' | 'floor' | 'ceil' | 'abs' | 'parse';
  decimals?: number;

  // Date operations
  inputFormat?: string;
  outputFormat?: string;
  timezone?: string;

  // JSON Path
  jsonPath?: string;

  // Template
  template?: string;

  // Math
  expression?: string;

  // Conditional
  condition?: string;
  thenValue?: unknown;
  elseValue?: unknown;

  // Custom JS
  code?: string;
}

export interface TransformationPreview {
  input: unknown;
  output: unknown;
  success: boolean;
  error?: string;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface WebhookConfig {
  id: string;
  workflowId: string;
  name: string;
  enabled: boolean;
  endpointUrl: string;
  secret?: string;
  signatureHeader?: string;
  signatureAlgorithm?: 'hmac-sha256' | 'hmac-sha1';
  headers?: Record<string, string>;
  allowedIps?: string[];
  rateLimit?: number; // requests per minute
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  timestamp: number;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  sourceIp: string;
  verified: boolean;
  processed: boolean;
  executionId?: string;
}

// ============================================
// RATE LIMITING TYPES
// ============================================

export interface RateLimitConfig {
  serviceId: string;
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
  retryAfter?: number; // seconds
  backoffMultiplier?: number;
  maxRetries?: number;
}

export interface RateLimitStatus {
  serviceId: string;
  remainingRequests: number;
  resetTime: number;
  isLimited: boolean;
  currentUsage: {
    minute: number;
    hour: number;
    day: number;
  };
}

// ============================================
// DEBUGGING TYPES
// ============================================

export interface Breakpoint {
  id: string;
  nodeId: string;
  enabled: boolean;
  condition?: string; // JS expression
  hitCount: number;
  logMessage?: string;
}

export interface DebugSession {
  id: string;
  executionId: string;
  isActive: boolean;
  isPaused: boolean;
  currentNodeId?: string;
  breakpoints: Breakpoint[];
  watchExpressions: WatchExpression[];
  callStack: DebugStackFrame[];
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: unknown;
  error?: string;
}

export interface DebugStackFrame {
  nodeId: string;
  nodeName: string;
  input: unknown;
  output?: unknown;
  timestamp: number;
}

// ============================================
// TEMPLATE MARKETPLACE TYPES
// ============================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  version: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  complexity: 'simple' | 'medium' | 'complex';
  nodeCount: number;
  edgeCount: number;
  requiredServices: string[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  featured?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  templateCount: number;
}
