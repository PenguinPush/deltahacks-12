/**
 * API Response Types
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Credential types
 */
export type CredentialType = 'api-key' | 'oauth2' | 'basic' | 'bearer';

/**
 * Stored credential (without sensitive data)
 */
export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  service: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  isValid: boolean;
}

/**
 * Credential creation request
 */
export interface CredentialCreateRequest {
  name: string;
  type: CredentialType;
  service: string;
  data: Record<string, string>;
}

/**
 * Credential update request
 */
export interface CredentialUpdateRequest {
  name?: string;
  data?: Record<string, string>;
}

/**
 * Workflow save request
 */
export interface WorkflowSaveRequest {
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  viewport?: unknown;
  tags?: string[];
}

/**
 * Workflow save response
 */
export interface WorkflowSaveResponse {
  id: string;
  version: string;
  savedAt: string;
}

/**
 * Workflow execution request
 */
export interface WorkflowExecuteRequest {
  workflowId: string;
  input?: Record<string, unknown>;
  credentials?: Record<string, string>;
  dryRun?: boolean;
}

/**
 * Node execution request (single node testing)
 */
export interface NodeExecuteRequest {
  nodeId: string;
  nodeData: unknown;
  input?: Record<string, unknown>;
  credentials?: Record<string, string>;
}

/**
 * Node execution response
 */
export interface NodeExecuteResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Template import request
 */
export interface TemplateImportRequest {
  templateId: string;
  name: string;
  description?: string;
  credentials: Record<string, string>;
  variables: Record<string, unknown>;
}

/**
 * Template export request
 */
export interface TemplateExportRequest {
  workflowId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  documentation?: string;
}

/**
 * API test request
 */
export interface ApiTestRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * API test response
 */
export interface ApiTestResponse {
  success: boolean;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  size: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    name: string;
    status: 'up' | 'down';
    latency?: number;
  }[];
}

/**
 * Request configuration
 */
export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}
