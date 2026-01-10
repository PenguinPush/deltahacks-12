import { memo } from 'react';
import clsx from 'clsx';
import type { TemplateListItem, TemplateDifficulty } from '@/types';
import { API_CATEGORIES } from '@constants/apiCategories';

/**
 * Props for TemplateCard component
 */
interface TemplateCardProps {
  /** Template data to display */
  template: TemplateListItem;
  /** Called when the card is clicked */
  onClick: () => void;
  /** Whether the card is selected */
  isSelected?: boolean;
}

/**
 * Difficulty badge colors
 */
const DIFFICULTY_COLORS: Record<TemplateDifficulty, string> = {
  beginner: 'bg-green-900/50 text-green-400 border-green-700',
  intermediate: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  advanced: 'bg-red-900/50 text-red-400 border-red-700',
};

/**
 * TemplateCard Component
 *
 * Card component for displaying a template in the library.
 * Shows template name, description, category, difficulty, and stats.
 *
 * TODO: Add preview image
 * TODO: Add hover animation
 * TODO: Add favorite button
 * TODO: Add quick-use action
 */
function TemplateCardComponent({
  template,
  onClick,
  isSelected = false,
}: TemplateCardProps): JSX.Element {
  /**
   * Get category info
   */
  const category = API_CATEGORIES.find((c) => c.id === template.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full text-left p-4 rounded-lg border transition-all',
        'bg-gray-800/50 hover:bg-gray-800',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-gray-700 hover:border-gray-600'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: category?.color + '20', color: category?.color }}
        >
          {template.icon || category?.icon.charAt(0).toUpperCase() || '?'}
        </div>

        {/* Title & Category */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-200 truncate">{template.name}</h3>
          <p className="text-xs text-gray-500">{category?.label || template.category}</p>
        </div>

        {/* Source Badge */}
        {template.source === 'official' && (
          <span className="px-1.5 py-0.5 bg-primary-900/50 text-primary-400 text-xs rounded border border-primary-700">
            Official
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-gray-400 line-clamp-2">{template.description}</p>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-gray-500 text-xs">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {/* Difficulty */}
        <span
          className={clsx(
            'px-2 py-0.5 text-xs rounded border',
            DIFFICULTY_COLORS[template.difficulty]
          )}
        >
          {template.difficulty}
        </span>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {template.downloads !== undefined && (
            <span className="flex items-center gap-1">
              <span>↓</span>
              {formatNumber(template.downloads)}
            </span>
          )}
          {template.rating !== undefined && (
            <span className="flex items-center gap-1">
              <span>★</span>
              {template.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export const TemplateCard = memo(TemplateCardComponent);

export default TemplateCard;
