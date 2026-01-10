/**
 * Project Types
 *
 * Types for project management (projects contain workflows)
 */

/**
 * Project status
 */
export type ProjectStatus = 'active' | 'archived' | 'deleted';

/**
 * Project definition
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  nodeCount: number;
  edgeCount: number;
  status: ProjectStatus;
  thumbnail?: string;
  tags?: string[];
  isPublic?: boolean;
  collaborators?: ProjectCollaborator[];
}

/**
 * Project collaborator
 */
export interface ProjectCollaborator {
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

/**
 * Project creation request
 */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  templateId?: string;
  tags?: string[];
}

/**
 * Project update request
 */
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Project list filters
 */
export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalNodes: number;
  totalEdges: number;
  totalExecutions: number;
}
