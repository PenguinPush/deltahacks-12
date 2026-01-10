// import { get, post, del } from './api';

/**
 * Share link configuration
 */
export interface ShareLink {
  id: string;
  workflowId: string;
  url: string;
  expiresAt?: string;
  permissions: 'view' | 'edit' | 'execute';
  createdAt: string;
  accessCount: number;
}

/**
 * Share link creation request
 */
export interface CreateShareLinkRequest {
  workflowId: string;
  permissions: 'view' | 'edit' | 'execute';
  expiresIn?: number; // hours
  password?: string;
}

/**
 * Share API Service
 *
 * Handles all API calls related to sharing workflows.
 *
 * TODO: Implement actual API endpoints
 * TODO: Add team sharing
 * TODO: Add public gallery submissions
 */
export const shareApi = {
  /**
   * Create a share link
   */
  async createShareLink(request: CreateShareLinkRequest): Promise<ShareLink> {
    // TODO: Implement actual API call
    // return post<ShareLink>('/share', request);

    const id = `share-${Date.now()}`;
    return Promise.resolve({
      id,
      workflowId: request.workflowId,
      url: `${window.location.origin}/share/${id}`,
      expiresAt: request.expiresIn
        ? new Date(Date.now() + request.expiresIn * 3600000).toISOString()
        : undefined,
      permissions: request.permissions,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    });
  },

  /**
   * Get share links for a workflow
   */
  async getShareLinks(_workflowId: string): Promise<ShareLink[]> {
    // TODO: Implement actual API call
    // return get<ShareLink[]>(`/workflows/${workflowId}/shares`);

    return Promise.resolve([]);
  },

  /**
   * Get a share link by ID
   */
  async getShareLink(shareId: string): Promise<ShareLink> {
    // TODO: Implement actual API call
    // return get<ShareLink>(`/share/${shareId}`);

    return Promise.resolve({
      id: shareId,
      workflowId: 'workflow-1',
      url: `${window.location.origin}/share/${shareId}`,
      permissions: 'view',
      createdAt: new Date().toISOString(),
      accessCount: 0,
    });
  },

  /**
   * Revoke a share link
   */
  async revokeShareLink(_shareId: string): Promise<void> {
    // TODO: Implement actual API call
    // return del(`/share/${shareId}`);

    return Promise.resolve();
  },

  /**
   * Access shared workflow (for recipients)
   */
  async accessSharedWorkflow(
    _shareId: string,
    _password?: string
  ): Promise<{
    workflow: unknown;
    permissions: 'view' | 'edit' | 'execute';
  }> {
    // TODO: Implement actual API call
    // return post(`/share/${shareId}/access`, { password });

    return Promise.resolve({
      workflow: {},
      permissions: 'view',
    });
  },

  /**
   * Copy shared workflow to own account
   */
  async copySharedWorkflow(_shareId: string, _newName: string): Promise<{ workflowId: string }> {
    // TODO: Implement actual API call
    // return post(`/share/${shareId}/copy`, { name: newName });

    return Promise.resolve({
      workflowId: `workflow-${Date.now()}`,
    });
  },
};

export default shareApi;
