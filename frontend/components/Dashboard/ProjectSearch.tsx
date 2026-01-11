import { memo } from 'react';

/**
 * Props for ProjectSearch component
 */
interface ProjectSearchProps {
  /** Current search value */
  value: string;
  /** Called when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * ProjectSearch Component
 *
 * Search input for filtering projects on the dashboard.
 *
 * TODO: Add debouncing for performance
 * TODO: Add keyboard shortcut (Cmd+K)
 * TODO: Add search suggestions
 */
function ProjectSearchComponent({
  value,
  onChange,
  placeholder = 'Search projects...',
}: ProjectSearchProps): JSX.Element {
  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          className="w-5 h-5 text-[#6A6A6A]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg
                   text-white placeholder-[#6A6A6A]
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   transition-colors"
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6A6A6A] hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        {!value && (
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-[#6A6A6A] bg-[#2A2A2A] rounded">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export const ProjectSearch = memo(ProjectSearchComponent);

export default ProjectSearch;
