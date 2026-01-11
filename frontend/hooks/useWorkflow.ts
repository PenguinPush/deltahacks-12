import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkflowStore } from '@stores/workflowStore';
import { workflowApi } from '@services/workflowApi';
import type {
  WorkflowListItem,
  WorkflowNode,
  WorkflowEdge,
  WorkflowValidation,
} from '@/types';

/**
 * Return type for useWorkflow hook
 */
interface UseWorkflowReturn {
  // State
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isModified: boolean;
  selectedNodeId: string | null;

  // Node operations
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Edge operations
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // Workflow operations
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<string>;
  clearWorkflow: () => void;

  // Validation
  validateWorkflow: () => WorkflowValidation;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

/**
 * useWorkflow Hook
 *
 * Custom hook for managing workflow state and operations.
 * Combines Zustand store with React Query for data fetching/persistence.
 *
 * TODO: Implement undo/redo functionality
 * TODO: Add real-time collaboration support
 * TODO: Add conflict resolution for concurrent edits
 */
export function useWorkflow(): UseWorkflowReturn {
  const queryClient = useQueryClient();

  // Get store state and actions
  const store = useWorkflowStore();

  /**
   * Load workflow mutation
   */
  const loadMutation = useMutation({
    mutationFn: async (id: string) => {
      const workflow = await workflowApi.getWorkflow(id);
      return workflow;
    },
    onSuccess: (workflow) => {
      store.loadWorkflow(workflow);
    },
  });

  /**
   * Save workflow mutation
   */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const definition = store.saveWorkflow();
      const result = await workflowApi.saveWorkflow(definition);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  /**
   * Load a workflow by ID
   */
  const loadWorkflow = useCallback(
    async (id: string) => {
      await loadMutation.mutateAsync(id);
    },
    [loadMutation]
  );

  /**
   * Save the current workflow
   */
  const saveWorkflow = useCallback(async () => {
    const result = await saveMutation.mutateAsync();
    return result.id;
  }, [saveMutation]);

  /**
   * Validate the current workflow
   */
  const validateWorkflow = useCallback((): WorkflowValidation => {
    const errors: WorkflowValidation['errors'] = [];
    const warnings: WorkflowValidation['warnings'] = [];

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    store.edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    store.nodes.forEach((node) => {
      // Check for disconnected nodes (except input nodes)
      if (!connectedNodeIds.has(node.id) && node.data.nodeType !== 'input') {
        warnings.push({
          nodeId: node.id,
          message: `Node "${node.data.label}" is not connected to the workflow`,
        });
      }

      // Check for incomplete API nodes
      if (node.data.nodeType === 'api') {
        const apiData = node.data as WorkflowNode['data'] & { url?: string };
        if (!apiData.url) {
          errors.push({
            nodeId: node.id,
            message: `Node "${node.data.label}" is missing a URL`,
            field: 'url',
          });
        }
      }
    });

    // Check for cycles (simplified check)
    // TODO: Implement full cycle detection

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [store.nodes, store.edges]);

  return {
    // State
    nodes: store.nodes,
    edges: store.edges,
    isModified: store.isModified,
    selectedNodeId: store.selectedNodeId,

    // Node operations
    addNode: store.addNode,
    updateNode: store.updateNode,
    removeNode: store.removeNode,
    duplicateNode: store.duplicateNode,

    // Edge operations
    addEdge: store.addEdge,
    removeEdge: store.removeEdge,

    // Selection
    selectNode: store.selectNode,

    // Workflow operations
    loadWorkflow,
    saveWorkflow,
    clearWorkflow: store.clearWorkflow,

    // Validation
    validateWorkflow,

    // Loading states
    isLoading: loadMutation.isPending,
    isSaving: saveMutation.isPending,
    error: loadMutation.error?.message || saveMutation.error?.message || null,
  };
}

/**
 * useWorkflowList Hook
 *
 * Hook for fetching and managing the list of saved workflows.
 */
export function useWorkflowList() {
  return useQuery<WorkflowListItem[]>({
    queryKey: ['workflows'],
    queryFn: () => workflowApi.listWorkflows(),
  });
}

export default useWorkflow;
