import { get, post, put, del } from './api';
import type {
  WorkflowDefinition,
  WorkflowListItem,
  WorkflowSaveResponse,
  WorkflowExecutionResult,
  NodeExecuteResponse,
  WorkflowNodeData,
} from '@/types';

/**
 * Workflow API Service
 *
 * Handles all API calls related to workflows.
 *
 * TODO: Add proper error handling
 * TODO: Add request cancellation
 * TODO: Add offline queue
 */
export const workflowApi = {
  /**
   * Get list of all workflows
   */
  async listWorkflows(): Promise<WorkflowListItem[]> {
    const response = await get<{ workflows: any[] }>('/workflows');
    return response.workflows.map((w: any) => ({
      id: w._id,
      name: w.name,
      description: w.description,
      updatedAt: w.updated_at,
      nodeCount: w.nodes?.length || 0,
    }));
  },

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const workflow = await get<any>(`/workflows/${id}`);
    return {
      metadata: {
        id: workflow._id,
        name: workflow.name,
        description: workflow.description,
        version: '1.0.0',
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
      },
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
    };
  },

  /**
   * Save a workflow
   */
  async saveWorkflow(definition: WorkflowDefinition): Promise<WorkflowSaveResponse> {
    const payload = {
      name: definition.metadata.name,
      description: definition.metadata.description,
      nodes: definition.nodes,
      edges: definition.edges,
    };

    if (definition.metadata.id) {
      const response = await put<any>(`/workflows/${definition.metadata.id}`, payload);
      return {
        id: response._id,
        version: definition.metadata.version,
        savedAt: response.updated_at,
      };
    }

    const response = await post<any>('/workflows', payload);
    return {
      id: response._id,
      version: definition.metadata.version,
      savedAt: response.created_at,
    };
  },

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await del(`/workflows/${id}`);
  },

  /**
   * Execute a single node
   */
  async executeNode(
    _nodeId: string,
    _nodeData: WorkflowNodeData,
    input?: unknown
  ): Promise<NodeExecuteResponse> {
    // TODO: Implement actual API call
    // return post<NodeExecuteResponse>('/execute/node', { nodeId, nodeData, input });

    // Mock implementation - simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          output: { message: 'Node executed successfully', input },
          duration: Math.floor(Math.random() * 1000) + 100,
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }, 500);
    });
  },

  /**
   * Execute a full workflow
   */
  async executeWorkflow(workflowId: string, input?: unknown): Promise<WorkflowExecutionResult> {
    const response = await post<any>('/execute', {
      workflow_id: workflowId,
      method: 'bfs',
      input_data: input || {},
    });

    return {
      workflowId: workflowId,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      nodeResults: response.block_results || [],
      finalOutput: response,
    };
  },

  /**
   * Get execution history for a workflow
   */
  async getExecutionHistory(workflowId: string): Promise<any[]> {
    const response = await get<{ executions: any[] }>(`/workflows/${workflowId}/executions`);
    return response.executions;
  },

  /**
   * Duplicate a workflow
   */
  async duplicateWorkflow(id: string, newName: string): Promise<WorkflowDefinition> {
    // TODO: Implement actual API call
    // return post<WorkflowDefinition>(`/workflows/${id}/duplicate`, { name: newName });

    const original = await this.getWorkflow(id);
    return {
      ...original,
      metadata: {
        ...original.metadata,
        id: `workflow-${Date.now()}`,
        name: newName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * Export workflow as JSON
   */
  async exportWorkflow(id: string): Promise<Blob> {
    const workflow = await this.getWorkflow(id);
    const json = JSON.stringify(workflow, null, 2);
    return new Blob([json], { type: 'application/json' });
  },

  /**
   * Import workflow from JSON
   */
  async importWorkflow(file: File): Promise<WorkflowDefinition> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const workflow = JSON.parse(content) as WorkflowDefinition;
          // Assign new ID to prevent conflicts
          workflow.metadata.id = `workflow-${Date.now()}`;
          workflow.metadata.createdAt = new Date().toISOString();
          workflow.metadata.updatedAt = new Date().toISOString();
          resolve(workflow);
        } catch (error) {
          reject(new Error('Invalid workflow file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};

export default workflowApi;
