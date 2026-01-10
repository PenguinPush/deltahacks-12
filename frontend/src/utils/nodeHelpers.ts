import type {
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  WorkflowNodeData,
} from '@/types';
import { NODE_TEMPLATES, NODE_TYPE_MAP, NODE_COLORS } from '@constants/nodeTypes';

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique edge ID
 */
export function generateEdgeId(source: string, target: string): string {
  return `edge-${source}-${target}-${Date.now()}`;
}

/**
 * Get React Flow node type from internal node type
 */
export function getFlowNodeType(nodeType: NodeType): string {
  return NODE_TYPE_MAP[nodeType] || 'default';
}

/**
 * Get node color by type
 */
export function getNodeColor(nodeType: NodeType): string {
  return NODE_COLORS[nodeType] || '#64748b';
}

/**
 * Create a new node from a template
 */
export function createNodeFromTemplate(
  templateId: string,
  position: { x: number; y: number }
): WorkflowNode | null {
  const template = NODE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  return {
    id: generateNodeId(),
    type: getFlowNodeType(template.type),
    position,
    data: {
      ...template.defaultData,
      label: template.label,
    } as WorkflowNodeData,
  };
}

/**
 * Get connected nodes (predecessors and successors)
 */
export function getConnectedNodes(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { predecessors: WorkflowNode[]; successors: WorkflowNode[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const predecessors = edges
    .filter((e) => e.target === nodeId)
    .map((e) => nodeMap.get(e.source))
    .filter((n): n is WorkflowNode => n !== undefined);

  const successors = edges
    .filter((e) => e.source === nodeId)
    .map((e) => nodeMap.get(e.target))
    .filter((n): n is WorkflowNode => n !== undefined);

  return { predecessors, successors };
}

/**
 * Get all upstream nodes (all predecessors recursively)
 */
export function getUpstreamNodes(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const result: WorkflowNode[] = [];

  function traverse(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    edges
      .filter((e) => e.target === currentId)
      .forEach((e) => {
        const node = nodeMap.get(e.source);
        if (node) {
          result.push(node);
          traverse(e.source);
        }
      });
  }

  traverse(nodeId);
  return result;
}

/**
 * Get all downstream nodes (all successors recursively)
 */
export function getDownstreamNodes(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const result: WorkflowNode[] = [];

  function traverse(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    edges
      .filter((e) => e.source === currentId)
      .forEach((e) => {
        const node = nodeMap.get(e.target);
        if (node) {
          result.push(node);
          traverse(e.target);
        }
      });
  }

  traverse(nodeId);
  return result;
}

/**
 * Get execution order (topological sort)
 */
export function getExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  // Build graph
  edges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  });

  // Find starting nodes (in-degree = 0)
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  // Process in topological order
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result: WorkflowNode[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) result.push(node);

    adjacency.get(nodeId)?.forEach((successor) => {
      const newDegree = (inDegree.get(successor) || 0) - 1;
      inDegree.set(successor, newDegree);
      if (newDegree === 0) queue.push(successor);
    });
  }

  return result;
}

/**
 * Check if connecting two nodes would create a cycle
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): boolean {
  // Check if target can reach source (would create cycle if we add source -> target edge)
  const downstream = getDownstreamNodes(targetId, nodes, edges);
  return downstream.some((n) => n.id === sourceId);
}

/**
 * Calculate node positions for auto-layout
 */
export function calculateAutoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const orderedNodes = getExecutionOrder(nodes, edges);

  // Simple horizontal layout
  const nodeSpacingX = 300;
  const nodeSpacingY = 150;
  const levelMap = new Map<string, number>();

  // Calculate levels
  orderedNodes.forEach((node, _index) => {
    const predecessorEdges = edges.filter((e) => e.target === node.id);

    if (predecessorEdges.length === 0) {
      levelMap.set(node.id, 0);
    } else {
      const maxPredecessorLevel = Math.max(
        ...predecessorEdges.map((e) => levelMap.get(e.source) || 0)
      );
      levelMap.set(node.id, maxPredecessorLevel + 1);
    }
  });

  // Group by level
  const levelGroups = new Map<number, WorkflowNode[]>();
  orderedNodes.forEach((node) => {
    const level = levelMap.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // Position nodes
  levelGroups.forEach((levelNodes, level) => {
    levelNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: level * nodeSpacingX + 100,
        y: index * nodeSpacingY + 100,
      });
    });
  });

  return positions;
}

/**
 * Duplicate a node with new IDs
 */
export function duplicateNode(
  node: WorkflowNode,
  offset = { x: 50, y: 50 }
): WorkflowNode {
  return {
    ...node,
    id: generateNodeId(),
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
    data: {
      ...node.data,
      label: `${node.data.label} (copy)`,
    },
  };
}

export default {
  generateNodeId,
  generateEdgeId,
  getFlowNodeType,
  getNodeColor,
  createNodeFromTemplate,
  getConnectedNodes,
  getUpstreamNodes,
  getDownstreamNodes,
  getExecutionOrder,
  wouldCreateCycle,
  calculateAutoLayout,
  duplicateNode,
};
