import type {
  WorkflowNode,
  WorkflowEdge,
  APINodeData,
  WorkflowValidation,
  WorkflowValidationError,
  WorkflowValidationWarning,
} from '@/types';

/**
 * URL validation regex
 */
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

/**
 * Variable reference regex (e.g., {{nodeName.field}})
 */
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Validate a URL string
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  // Allow variable references
  if (url.includes('{{') && url.includes('}}')) {
    return true;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return URL_REGEX.test(url);
  }
}

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  if (!str) return true;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate API node data
 */
export function validateAPINode(
  data: APINodeData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check URL
  if (!data.url) {
    errors.push('URL is required');
  } else if (!isValidUrl(data.url)) {
    errors.push('Invalid URL format');
  }

  // Check body JSON for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(data.method) && data.body) {
    if (data.bodyType === 'json' && !isValidJson(data.body)) {
      errors.push('Request body is not valid JSON');
    }
  }

  // Check headers
  data.headers.forEach((header, index) => {
    if (header.enabled && !header.key) {
      errors.push(`Header at position ${index + 1} is missing a key`);
    }
  });

  // Check query params
  data.queryParams.forEach((param, index) => {
    if (param.enabled && !param.key) {
      errors.push(`Query parameter at position ${index + 1} is missing a key`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate entire workflow
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowValidation {
  const errors: WorkflowValidationError[] = [];
  const warnings: WorkflowValidationWarning[] = [];

  // Check if workflow is empty
  if (nodes.length === 0) {
    warnings.push({
      message: 'Workflow has no nodes',
    });
    return { isValid: true, errors, warnings };
  }

  // Build node connections map
  const incomingEdges = new Map<string, WorkflowEdge[]>();
  const outgoingEdges = new Map<string, WorkflowEdge[]>();

  edges.forEach((edge) => {
    // Incoming
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);

    // Outgoing
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge);
  });

  // Validate each node
  nodes.forEach((node) => {
    // Check for disconnected nodes
    const hasIncoming = incomingEdges.has(node.id);
    const hasOutgoing = outgoingEdges.has(node.id);

    if (!hasIncoming && !hasOutgoing) {
      warnings.push({
        nodeId: node.id,
        message: `Node "${node.data.label}" is completely disconnected`,
        suggestion: 'Connect this node to the workflow or remove it',
      });
    }

    // Node-type specific validation
    if (node.data.nodeType === 'api') {
      const apiData = node.data as APINodeData;
      const validation = validateAPINode(apiData);

      validation.errors.forEach((error) => {
        errors.push({
          nodeId: node.id,
          message: `${node.data.label}: ${error}`,
        });
      });
    }

    // Check input nodes have outgoing connections
    if (node.data.nodeType === 'input' && !hasOutgoing) {
      warnings.push({
        nodeId: node.id,
        message: `Input node "${node.data.label}" has no outgoing connections`,
      });
    }

    // Check output nodes have incoming connections
    if (node.data.nodeType === 'output' && !hasIncoming) {
      warnings.push({
        nodeId: node.id,
        message: `Output node "${node.data.label}" has no incoming connections`,
      });
    }
  });

  // Check for cycles
  const cycleNodes = detectCycles(nodes, edges);
  if (cycleNodes.length > 0) {
    errors.push({
      message: `Workflow contains a cycle involving nodes: ${cycleNodes.join(', ')}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect cycles in the workflow graph using DFS
 */
function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
  });
  edges.forEach((edge) => {
    adjacencyList.get(edge.source)?.push(edge.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          cycleNodes.push(nodeId);
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        cycleNodes.push(nodeId);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycleNodes;
}

/**
 * Extract variable references from a string
 */
export function extractVariableReferences(str: string): string[] {
  const matches = str.match(VARIABLE_REGEX);
  if (!matches) return [];

  return matches.map((match) => match.slice(2, -2)); // Remove {{ and }}
}

/**
 * Validate variable references exist in the workflow
 */
export function validateVariableReferences(
  str: string,
  availableNodes: WorkflowNode[]
): { valid: boolean; missing: string[] } {
  const references = extractVariableReferences(str);
  const nodeIds = new Set(availableNodes.map((n) => n.id));
  const missing: string[] = [];

  references.forEach((ref) => {
    const [nodeId] = ref.split('.');
    if (nodeId && !nodeIds.has(nodeId)) {
      missing.push(ref);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

export default {
  isValidUrl,
  isValidEmail,
  isValidJson,
  validateAPINode,
  validateWorkflow,
  extractVariableReferences,
  validateVariableReferences,
};
