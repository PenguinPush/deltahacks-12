// import { get, post, put, del } from './api';
// import type { WorkflowDefinition, WorkflowListItem } from '@/types';
import type { Project, ProjectCreateRequest, ProjectUpdateRequest } from '@/types/project.types';

/**
 * Project API Service
 *
 * Handles all API calls related to projects (which contain workflows).
 *
 * TODO: Implement actual API endpoints
 * TODO: Add project sharing
 * TODO: Add project collaboration
 */
export const projectApi = {
  /**
   * Get list of all projects
   */
  async listProjects(): Promise<Project[]> {
    // TODO: Implement actual API call
    // return get<Project[]>('/projects');

    return Promise.resolve([
      {
        id: 'proj-1',
        name: 'E-commerce Integration',
        description: 'Stripe to Airtable workflow',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
        nodeCount: 5,
        edgeCount: 4,
        status: 'active',
      },
      {
        id: 'proj-2',
        name: 'Customer Notification',
        description: 'SendGrid email automation',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        nodeCount: 3,
        edgeCount: 2,
        status: 'active',
      },
    ]);
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    // TODO: Implement actual API call
    // return get<Project>(`/projects/${id}`);

    return Promise.resolve({
      id,
      name: 'Sample Project',
      description: 'A sample project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: 0,
      edgeCount: 0,
      status: 'active',
    });
  },

  /**
   * Create a new project
   */
  async createProject(request: ProjectCreateRequest): Promise<Project> {
    // TODO: Implement actual API call
    // return post<Project>('/projects', request);

    return Promise.resolve({
      id: `proj-${Date.now()}`,
      name: request.name,
      description: request.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: 0,
      edgeCount: 0,
      status: 'active',
    });
  },

  /**
   * Update a project
   */
  async updateProject(id: string, request: ProjectUpdateRequest): Promise<Project> {
    // TODO: Implement actual API call
    // return put<Project>(`/projects/${id}`, request);

    const existing = await this.getProject(id);
    return {
      ...existing,
      ...request,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete a project
   */
  async deleteProject(_id: string): Promise<void> {
    // TODO: Implement actual API call
    // return del(`/projects/${id}`);

    return Promise.resolve();
  },

  /**
   * Duplicate a project
   */
  async duplicateProject(id: string, newName: string): Promise<Project> {
    // TODO: Implement actual API call
    // return post<Project>(`/projects/${id}/duplicate`, { name: newName });

    const original = await this.getProject(id);
    return {
      ...original,
      id: `proj-${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Search projects
   */
  async searchProjects(query: string): Promise<Project[]> {
    const all = await this.listProjects();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
    );
  },
};

export default projectApi;
