import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@services/templateApi';
import type {
  Template,
  TemplateListItem,
  TemplateFilters,
  TemplateInstantiationConfig,
  WorkflowDefinition,
} from '@/types';

/**
 * Return type for useTemplates hook
 */
interface UseTemplatesReturn {
  // Template list
  templates: TemplateListItem[];
  isLoading: boolean;
  error: string | null;

  // Template details
  getTemplate: (id: string) => Promise<Template>;

  // Template operations
  instantiateTemplate: (config: TemplateInstantiationConfig) => Promise<WorkflowDefinition>;
  isInstantiating: boolean;

  // Refresh
  refresh: () => void;
}

/**
 * Return type for useTemplate hook (single template)
 */
interface UseTemplateReturn {
  template: Template | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * useTemplates Hook
 *
 * Custom hook for fetching and managing template list.
 *
 * TODO: Add template caching
 * TODO: Add template sorting
 * TODO: Add pagination support
 */
export function useTemplates(filters: TemplateFilters = {}): UseTemplatesReturn {
  const queryClient = useQueryClient();

  /**
   * Fetch templates query
   */
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery<TemplateListItem[]>({
    queryKey: ['templates', filters],
    queryFn: () => templateApi.listTemplates(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Instantiate template mutation
   */
  const instantiateMutation = useMutation({
    mutationFn: async (config: TemplateInstantiationConfig): Promise<WorkflowDefinition> => {
      // TODO: Implement actual template instantiation
      const template = await templateApi.getTemplate(config.name);
      return {
        ...template.workflow,
        metadata: {
          ...template.workflow.metadata,
          name: config.name,
          description: config.description || template.metadata.description,
          id: `workflow-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    },
  });

  /**
   * Get a single template by ID
   */
  const getTemplate = useCallback(async (id: string): Promise<Template> => {
    return templateApi.getTemplate(id);
  }, []);

  /**
   * Instantiate a template
   */
  const instantiateTemplate = useCallback(
    async (config: TemplateInstantiationConfig): Promise<WorkflowDefinition> => {
      return instantiateMutation.mutateAsync(config);
    },
    [instantiateMutation]
  );

  /**
   * Refresh template list
   */
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  }, [queryClient]);

  return {
    templates,
    isLoading,
    error: error?.message || null,
    getTemplate,
    instantiateTemplate,
    isInstantiating: instantiateMutation.isPending,
    refresh,
  };
}

/**
 * useTemplate Hook
 *
 * Custom hook for fetching a single template by ID.
 */
export function useTemplate(id: string | null): UseTemplateReturn {
  const { data, isLoading, error } = useQuery<Template>({
    queryKey: ['template', id],
    queryFn: () => (id ? templateApi.getTemplate(id) : Promise.reject('No ID provided')),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    template: data || null,
    isLoading,
    error: error?.message || null,
  };
}

/**
 * useTemplateCategories Hook
 *
 * Custom hook for fetching template categories.
 */
export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templateApi.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export default useTemplates;
