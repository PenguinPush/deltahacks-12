import { useState, useCallback } from 'react';
import { NODE_CATEGORIES, NODE_TEMPLATES } from '@constants/nodeTypes';
import type { NodeTemplate, NodeCategory } from '@/types';

/**
 * Props for NodePaletteItem
 */
interface NodePaletteItemProps {
  template: NodeTemplate;
}

/**
 * NodePaletteItem Component
 *
 * A draggable node template in the palette
 */
function NodePaletteItem({ template }: NodePaletteItemProps): JSX.Element {
  /**
   * Handle drag start - set node data for drop
   */
  const onDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/nodelink-node-type', `${template.type}Node`);
      event.dataTransfer.setData(
        'application/nodelink-node-data',
        JSON.stringify(template.defaultData)
      );
      event.dataTransfer.effectAllowed = 'move';
    },
    [template]
  );

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700
                 cursor-grab hover:bg-gray-700/50 hover:border-gray-600 transition-colors"
      draggable
      onDragStart={onDragStart}
    >
      {/* TODO: Add icon component */}
      <div className="w-8 h-8 rounded-md bg-primary-500/20 flex items-center justify-center">
        <span className="text-primary-400 text-sm">{template.icon.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">{template.label}</div>
        <div className="text-xs text-gray-500 truncate">{template.description}</div>
      </div>
    </div>
  );
}

/**
 * Props for NodeCategorySection
 */
interface NodeCategorySectionProps {
  category: NodeCategory;
  templates: NodeTemplate[];
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * NodeCategorySection Component
 *
 * A collapsible section for a node category
 */
function NodeCategorySection({
  category,
  templates,
  isExpanded,
  onToggle,
}: NodeCategorySectionProps): JSX.Element {
  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        {/* TODO: Add icon component */}
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-700">
          <span className="text-xs text-gray-400">{category.icon.charAt(0).toUpperCase()}</span>
        </div>
        <span className="flex-1 text-left text-sm font-medium text-gray-300">{category.label}</span>
        <span
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {templates.map((template) => (
            <NodePaletteItem key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NodePalette Component
 *
 * Sidebar containing draggable node templates organized by category.
 * Users can drag nodes from here onto the canvas.
 *
 * TODO: Implement search/filter functionality
 * TODO: Implement favorites/pinned nodes
 * TODO: Implement recent nodes section
 * TODO: Add keyboard navigation
 */
export function NodePalette(): JSX.Element {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(NODE_CATEGORIES.map((c) => c.id))
  );
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Toggle category expansion
   */
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  /**
   * Get templates for a category, filtered by search
   */
  const getTemplatesForCategory = useCallback(
    (categoryId: string): NodeTemplate[] => {
      return NODE_TEMPLATES.filter((template) => {
        const matchesCategory = template.category === categoryId;
        const matchesSearch =
          searchQuery === '' ||
          template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    },
    [searchQuery]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200">Nodes</h2>
        <p className="text-xs text-gray-500 mt-1">Drag nodes to the canvas</p>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                     text-sm text-gray-200 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {NODE_CATEGORIES.map((category) => {
          const templates = getTemplatesForCategory(category.id);
          if (templates.length === 0 && searchQuery !== '') return null;

          return (
            <NodeCategorySection
              key={category.id}
              category={category}
              templates={templates}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <button
          className="w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200
                     hover:bg-gray-800 rounded-md transition-colors"
          onClick={() => {
            // TODO: Open template library modal
          }}
        >
          Browse Templates
        </button>
      </div>
    </div>
  );
}

export default NodePalette;
