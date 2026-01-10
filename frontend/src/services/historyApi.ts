// import { get, post } from './api';
import type { WorkflowDefinition } from '@/types';

/**
 * Version history entry
 */
export interface VersionEntry {
  id: string;
  workflowId: string;
  version: string;
  createdAt: string;
  createdBy?: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
}

/**
 * History API Service
 *
 * Handles all API calls related to workflow version history.
 *
 * TODO: Implement actual API endpoints
 * TODO: Add diff generation between versions
 */
export const historyApi = {
  /**
   * Get version history for a workflow
   */
  async getHistory(workflowId: string): Promise<VersionEntry[]> {
    // TODO: Implement actual API call
    // return get<VersionEntry[]>(`/workflows/${workflowId}/history`);

    return Promise.resolve([
      {
        id: 'v3',
        workflowId,
        version: '1.0.2',
        createdAt: new Date().toISOString(),
        description: 'Added error handling',
        nodeCount: 5,
        edgeCount: 4,
      },
      {
        id: 'v2',
        workflowId,
        version: '1.0.1',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        description: 'Updated API endpoint',
        nodeCount: 4,
        edgeCount: 3,
      },
      {
        id: 'v1',
        workflowId,
        version: '1.0.0',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        description: 'Initial version',
        nodeCount: 3,
        edgeCount: 2,
      },
    ]);
  },

  /**
   * Get a specific version
   */
  async getVersion(workflowId: string, _versionId: string): Promise<WorkflowDefinition> {
    // TODO: Implement actual API call
    // return get<WorkflowDefinition>(`/workflows/${workflowId}/history/${versionId}`);

    return Promise.resolve({
      metadata: {
        id: workflowId,
        name: 'Sample Workflow',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: [],
      edges: [],
    });
  },

  /**
   * Restore a specific version
   */
  async restoreVersion(workflowId: string, versionId: string): Promise<WorkflowDefinition> {
    // TODO: Implement actual API call
    // return post<WorkflowDefinition>(`/workflows/${workflowId}/history/${versionId}/restore`);

    return this.getVersion(workflowId, versionId);
  },

  /**
   * Create a named version/snapshot
   */
  async createSnapshot(
    workflowId: string,
    description: string
  ): Promise<VersionEntry> {
    // TODO: Implement actual API call
    // return post<VersionEntry>(`/workflows/${workflowId}/history`, { description });

    return Promise.resolve({
      id: `v-${Date.now()}`,
      workflowId,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description,
      nodeCount: 0,
      edgeCount: 0,
    });
  },

  /**
   * Compare two versions
   */
  async compareVersions(
    _workflowId: string,
    _versionA: string,
    _versionB: string
  ): Promise<{
    added: { nodes: string[]; edges: string[] };
    removed: { nodes: string[]; edges: string[] };
    modified: { nodes: string[]; edges: string[] };
  }> {
    // TODO: Implement actual diff logic
    return Promise.resolve({
      added: { nodes: [], edges: [] },
      removed: { nodes: [], edges: [] },
      modified: { nodes: [], edges: [] },
    });
  },
};

export default historyApi;
