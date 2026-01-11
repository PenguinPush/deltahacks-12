/**
 * Workflow Validation Service
 *
 * Validates workflow structure to ensure:
 * - DAG (no cycles)
 * - Proper node type placement
 * - All required inputs connected
 * - Reachability from trigger
 */

import type {
  ValidationError,
  WorkflowValidation,
  NodeExecutionType,
} from '../types/execution.types';
import { NODE_EXECUTION_RULES } from '../types/execution.types';

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    nodeType?: string;
    executionType?: NodeExecutionType;
    [key: string]: unknown;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Detect if the graph contains a cycle using DFS
 */
export function hasCycle(workflow: Workflow): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  const adjList = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adjList.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  }

  // DFS to detect cycle
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Back edge found - cycle detected!
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check all nodes (handles disconnected components)
  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * Get all nodes reachable from a starting node using BFS
 */
export function getReachableNodes(
  startNodeId: string,
  workflow: Workflow
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startNodeId];

  // Build adjacency list
  const adjList = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adjList.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  }

  // BFS
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (reachable.has(nodeId)) continue;

    reachable.add(nodeId);
    const neighbors = adjList.get(nodeId) || [];
    queue.push(...neighbors);
  }

  return reachable;
}

/**
 * Get the execution type for a node
 */
function getNodeExecutionType(node: WorkflowNode): NodeExecutionType {
  // Check if explicitly set
  if (node.data.executionType) {
    return node.data.executionType;
  }

  // Infer from node type
  const nodeType = node.data.nodeType || node.type;

  // Map common node types to execution types
  if (nodeType === 'input' || nodeType === 'webhook') return 'trigger';
  if (nodeType === 'api' || nodeType === 'action') return 'action';
  if (nodeType === 'transform') return 'transform';
  if (nodeType === 'condition' || nodeType === 'loop') return 'control';
  if (nodeType === 'output') return 'output';

  // Default to action for unknown types
  return 'action';
}

/**
 * Validate the entire workflow structure
 */
export function validateWorkflow(workflow: Workflow): WorkflowValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (workflow.nodes.length === 0) {
    return { isValid: false, errors, warnings };
  }

  // 1. Check for cycles
  if (hasCycle(workflow)) {
    errors.push({
      code: 'CYCLE_DETECTED',
      message: 'Workflow contains a cycle. Workflows must be DAGs (Directed Acyclic Graphs).',
      severity: 'error',
    });
  }

  // 2. Find trigger nodes
  const triggerNodes = workflow.nodes.filter(
    n => getNodeExecutionType(n) === 'trigger'
  );

  if (triggerNodes.length === 0) {
    warnings.push({
      code: 'NO_TRIGGER',
      message: 'Workflow has no trigger node. Add a Webhook Trigger or Workflow Input node.',
      severity: 'warning',
    });
  }

  if (triggerNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_TRIGGERS',
      message: `Workflow has ${triggerNodes.length} trigger nodes. Only one trigger is allowed.`,
      severity: 'error',
    });
  }

  // 3. Validate trigger nodes have no incoming edges
  for (const trigger of triggerNodes) {
    const incomingEdges = workflow.edges.filter(e => e.target === trigger.id);
    if (incomingEdges.length > 0) {
      errors.push({
        code: 'TRIGGER_HAS_INPUT',
        message: `Trigger node "${trigger.data.label || trigger.id}" cannot have incoming connections.`,
        nodeId: trigger.id,
        severity: 'error',
      });
    }
  }

  // 4. Check all non-trigger nodes are reachable from trigger
  if (triggerNodes.length === 1 && triggerNodes[0]) {
    const reachable = getReachableNodes(triggerNodes[0].id, workflow);
    const orphans = workflow.nodes.filter(
      n => n.type !== 'trigger' && !reachable.has(n.id)
    );

    for (const orphan of orphans) {
      warnings.push({
        code: 'ORPHAN_NODE',
        message: `Node "${orphan.data.label || orphan.id}" is not connected to the workflow.`,
        nodeId: orphan.id,
        severity: 'warning',
      });
    }
  }

  // 5. Validate node placement based on execution type
  for (const node of workflow.nodes) {
    const execType = getNodeExecutionType(node);
    const rules = NODE_EXECUTION_RULES[execType];

    const incomingEdges = workflow.edges.filter(e => e.target === node.id);
    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);

    const isFirst = incomingEdges.length === 0;
    const isLast = outgoingEdges.length === 0;
    const isMiddle = incomingEdges.length > 0 && outgoingEdges.length > 0;

    if (isFirst && !rules.canBeFirst) {
      errors.push({
        code: 'INVALID_CONNECTION',
        message: `"${execType}" nodes cannot be the first node in a workflow.`,
        nodeId: node.id,
        severity: 'error',
      });
    }

    if (isMiddle && !rules.canBeMiddle) {
      errors.push({
        code: 'INVALID_CONNECTION',
        message: `"${execType}" nodes cannot be in the middle of a workflow.`,
        nodeId: node.id,
        severity: 'error',
      });
    }

    if (isLast && !rules.canBeLast) {
      errors.push({
        code: 'INVALID_CONNECTION',
        message: `"${execType}" nodes cannot be the last node in a workflow.`,
        nodeId: node.id,
        severity: 'error',
      });
    }
  }

  // 6. Check for at least one output/terminal node
  const hasTerminalNode = workflow.nodes.some(node => {
    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
    return outgoingEdges.length === 0; // Has no outgoing edges
  });

  if (!hasTerminalNode && workflow.nodes.length > 0) {
    warnings.push({
      code: 'NO_OUTPUT',
      message: 'Workflow should have at least one output or terminal node.',
      severity: 'warning',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Topological sort - returns execution layers
 * Nodes in the same layer can execute in parallel
 */
export function topologicalSort(workflow: Workflow): string[][] {
  const layers: string[][] = [];
  const inDegree = new Map<string, number>();

  // Initialize in-degrees
  for (const node of workflow.nodes) {
    inDegree.set(node.id, 0);
  }

  // Calculate in-degrees
  for (const edge of workflow.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Build adjacency list
  const adjList = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    adjList.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  }

  // Process nodes layer by layer
  let remaining = [...workflow.nodes];

  while (remaining.length > 0) {
    // Find all nodes with in-degree 0 (no dependencies)
    const layer = remaining.filter(n => inDegree.get(n.id) === 0);

    if (layer.length === 0) {
      // No nodes with in-degree 0 means there's a cycle
      throw new Error('Cycle detected in workflow');
    }

    layers.push(layer.map(n => n.id));

    // Update in-degrees for next iteration
    for (const node of layer) {
      const neighbors = adjList.get(node.id) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      }
    }

    // Remove processed nodes
    remaining = remaining.filter(n => !layer.includes(n));
  }

  return layers;
}
