import type { WorkflowDefinition } from './workflow.types';

/**
 * Template category for organization
 */
export type TemplateCategory =
  | 'payment'
  | 'email'
  | 'storage'
  | 'social'
  | 'analytics'
  | 'crm'
  | 'messaging'
  | 'ai'
  | 'database'
  | 'utility'
  | 'custom';

/**
 * Template difficulty level
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Template source
 */
export type TemplateSource = 'official' | 'community' | 'custom';

/**
 * Template metadata
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  source: TemplateSource;
  author?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  downloads?: number;
  rating?: number;
  tags: string[];
  icon?: string;
  previewImage?: string;
}

/**
 * Required credential for a template
 */
export interface TemplateCredential {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
}

/**
 * Template configuration variable
 */
export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

/**
 * Complete template definition
 */
export interface Template {
  metadata: TemplateMetadata;
  workflow: WorkflowDefinition;
  credentials: TemplateCredential[];
  variables: TemplateVariable[];
  documentation?: string;
}

/**
 * Template list item (for browsing)
 */
export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  source: TemplateSource;
  icon?: string;
  downloads?: number;
  rating?: number;
  tags: string[];
}

/**
 * Template filter options
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  difficulty?: TemplateDifficulty;
  source?: TemplateSource;
  search?: string;
  tags?: string[];
}

/**
 * Template category info
 */
export interface TemplateCategoryInfo {
  id: TemplateCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * State for template browsing
 */
export interface TemplateState {
  templates: TemplateListItem[];
  selectedTemplate: Template | null;
  filters: TemplateFilters;
  isLoading: boolean;
  error: string | null;
}

/**
 * Template instantiation config
 */
export interface TemplateInstantiationConfig {
  name: string;
  description?: string;
  credentials: Record<string, string>;
  variables: Record<string, unknown>;
}
