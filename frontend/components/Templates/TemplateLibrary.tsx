import { useState, useCallback, useMemo } from 'react';
import { TemplateCard } from './TemplateCard';
import { Modal, Input, Select, Loader } from '@components/common';
import { API_CATEGORIES } from '@constants/apiCategories';
import { useTemplates } from '@hooks/useTemplates';
import type {
  TemplateFilters,
  TemplateCategory,
  TemplateDifficulty,
} from '@/types';

/**
 * Props for TemplateLibrary component
 */
interface TemplateLibraryProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Called when a template is selected for use */
  onSelectTemplate: (templateId: string) => void;
}

/**
 * Difficulty options for filtering
 */
const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

/**
 * TemplateLibrary Component
 *
 * Modal for browsing and selecting pre-built API workflow templates.
 * Supports filtering by category, difficulty, and search.
 *
 * TODO: Add template preview
 * TODO: Add template ratings and reviews
 * TODO: Add template favoriting
 * TODO: Add template import from URL/file
 * TODO: Add template sharing
 * TODO: Add infinite scroll/pagination
 */
export function TemplateLibrary({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateLibraryProps): JSX.Element {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const { templates, isLoading, error } = useTemplates(filters);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  /**
   * Handle category filter change
   */
  const handleCategoryChange = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: category ? (category as TemplateCategory) : undefined,
    }));
  }, []);

  /**
   * Handle difficulty filter change
   */
  const handleDifficultyChange = useCallback((difficulty: string) => {
    setFilters((prev) => ({
      ...prev,
      difficulty: difficulty ? (difficulty as TemplateDifficulty) : undefined,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Category options including "All"
   */
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All Categories' },
      ...API_CATEGORIES.map((cat) => ({ value: cat.id, label: cat.label })),
    ],
    []
  );

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(
    () => !!(filters.search || filters.category || filters.difficulty),
    [filters]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Library" size="lg">
      <div className="flex flex-col h-[70vh]">
        {/* Filters */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search templates..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <Select
            value={filters.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={categoryOptions}
          />

          {/* Difficulty Filter */}
          <Select
            value={filters.difficulty || ''}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            options={DIFFICULTY_OPTIONS}
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 overflow-x-auto">
          {API_CATEGORIES.slice(0, 8).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                handleCategoryChange(filters.category === category.id ? '' : category.id)
              }
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                filters.category === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader size="lg" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && templates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No templates found</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onSelectTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <span className="text-sm text-gray-500">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default TemplateLibrary;
