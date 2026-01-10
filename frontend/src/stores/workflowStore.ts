import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  WorkflowState,
  WorkflowStore,
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  WorkflowMetadata,
  WorkflowStatus,
  WorkflowExecutionResult,
  SchemaField,
  APINodeData,
} from '@/types';

/**
 * Initial workflow state
 */
const initialState: WorkflowState = {
  metadata: null,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  selectedEdgeId: null,
  isModified: false,
  executionStatus: 'idle',
  executionResult: null,
  isExecuting: false,
};

/**
 * Create default metadata for a new workflow
 */
function createDefaultMetadata(): WorkflowMetadata {
  return {
    id: uuidv4(),
    name: 'Untitled Workflow',
    description: '',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  };
}

/**
 * Workflow Store
 *
 * Zustand store for managing workflow state.
 * Includes persistence to localStorage.
 *
 * TODO: Implement undo/redo with history stack
 * TODO: Add optimistic updates
 * TODO: Add offline sync support
 */
export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Node operations
      addNode: (node: WorkflowNode) => {
        set((state) => ({
          nodes: [...state.nodes, node],
          isModified: true,
        }));
      },

      updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } as WorkflowNode['data'] }
              : node
          ),
          isModified: true,
        }));
      },

      removeNode: (nodeId: string) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isModified: true,
        }));
      },

      duplicateNode: (nodeId: string) => {
        const state = get();
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const newNode: WorkflowNode = {
          ...node,
          id: `node-${Date.now()}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: {
            ...node.data,
            label: `${node.data.label} (copy)`,
          },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          selectedNodeId: newNode.id,
          isModified: true,
        }));
      },

      // Edge operations
      addEdge: (edge: WorkflowEdge) => {
        // Check for duplicate edges
        const exists = get().edges.some(
          (e) =>
            e.source === edge.source &&
            e.target === edge.target &&
            e.sourceHandle === edge.sourceHandle &&
            e.targetHandle === edge.targetHandle
        );

        if (!exists) {
          set((state) => ({
            edges: [...state.edges, edge],
            isModified: true,
          }));
        }
      },

      updateEdge: (edgeId: string, data: Partial<WorkflowEdge>) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId ? { ...edge, ...data } : edge
          ),
          isModified: true,
        }));
      },

      removeEdge: (edgeId: string) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
          selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
          isModified: true,
        }));
      },

      // Selection
      selectNode: (nodeId: string | null) => {
        set({ selectedNodeId: nodeId, selectedEdgeId: null });
      },

      selectEdge: (edgeId: string | null) => {
        set({ selectedEdgeId: edgeId, selectedNodeId: null });
      },

      // Viewport
      setViewport: (viewport) => {
        set({ viewport });
      },

      // Workflow operations
      loadWorkflow: (definition: WorkflowDefinition) => {
        set({
          metadata: definition.metadata,
          nodes: definition.nodes,
          edges: definition.edges,
          viewport: definition.viewport || { x: 0, y: 0, zoom: 1 },
          selectedNodeId: null,
          selectedEdgeId: null,
          isModified: false,
          executionStatus: 'idle',
          executionResult: null,
        });
      },

      saveWorkflow: (): WorkflowDefinition => {
        const state = get();
        const metadata = state.metadata || createDefaultMetadata();

        const definition: WorkflowDefinition = {
          metadata: {
            ...metadata,
            updatedAt: new Date().toISOString(),
          },
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        };

        set({
          metadata: definition.metadata,
          isModified: false,
        });

        return definition;
      },

      clearWorkflow: () => {
        set({
          ...initialState,
          metadata: createDefaultMetadata(),
        });
      },

      updateMetadata: (metadata: Partial<WorkflowMetadata>) => {
        set((state) => ({
          metadata: state.metadata
            ? { ...state.metadata, ...metadata, updatedAt: new Date().toISOString() }
            : { ...createDefaultMetadata(), ...metadata },
          isModified: true,
        }));
      },

      // Execution
      setExecutionStatus: (status: WorkflowStatus) => {
        set({
          executionStatus: status,
          isExecuting: status === 'running',
        });
      },

      setExecutionResult: (result: WorkflowExecutionResult | null) => {
        set({
          executionResult: result,
          executionStatus: result?.status || 'idle',
          isExecuting: false,
        });
      },

      // History (TODO: Implement)
      undo: () => {
        // TODO: Implement undo with history stack
        console.warn('Undo not yet implemented');
      },

      redo: () => {
        // TODO: Implement redo with history stack
        console.warn('Redo not yet implemented');
      },

      canUndo: () => {
        // TODO: Check history stack
        return false;
      },

      canRedo: () => {
        // TODO: Check history stack
        return false;
      },
    }),
    {
      name: 'nodelink-workflow',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        metadata: state.metadata,
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      }),
    }
  )
);

/**
 * Selector for selected node data
 */
export const useSelectedNode = () => {
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  return nodes.find((node) => node.id === selectedNodeId) || null;
};

/**
 * Selector for node by ID
 */
export const useNodeById = (nodeId: string | null) => {
  const nodes = useWorkflowStore((state) => state.nodes);
  return nodeId ? nodes.find((node) => node.id === nodeId) || null : null;
};

/**
 * Get upstream nodes and their output schemas for a given node
 */
export const useUpstreamOutputFields = (nodeId: string | null) => {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  if (!nodeId) return [];

  // Find all edges where target is our node
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Get source nodes and their output schemas
  return incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;

      // Get response schema from API nodes
      const responseSchema: SchemaField[] =
        sourceNode.data.nodeType === 'api'
          ? (sourceNode.data as APINodeData).responseSchema || []
          : [];

      return {
        nodeId: sourceNode.id,
        nodeLabel: sourceNode.data.label,
        fields: responseSchema,
      };
    })
    .filter((source): source is NonNullable<typeof source> => source !== null);
};

export default useWorkflowStore;
