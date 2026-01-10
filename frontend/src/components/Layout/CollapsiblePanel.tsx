import { type ReactNode, useState } from 'react';
import clsx from 'clsx';

/**
 * Props for CollapsiblePanel component
 */
interface CollapsiblePanelProps {
  /** Which side the panel is on */
  side: 'left' | 'right';
  /** Whether the panel is currently open */
  isOpen: boolean;
  /** Callback when toggle button is clicked */
  onToggle: () => void;
  /** Width of the panel when open (in pixels) */
  width: number;
  /** Panel title */
  title: string;
  /** Panel content */
  children: ReactNode;
}

/**
 * CollapsiblePanel Component
 *
 * A panel that can be collapsed/expanded.
 * Used for the left (Components) and right (Properties) panels.
 * Automatically expands on hover when collapsed.
 *
 * TODO: Add resize drag handle
 * TODO: Add keyboard shortcut to toggle
 */
export function CollapsiblePanel({
  side,
  isOpen,
  onToggle,
  width,
  title,
  children,
}: CollapsiblePanelProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShow = isOpen || isHovered;

  return (
    <aside
      className={clsx(
        'relative flex-shrink-0 bg-[#1A1A1A] border-[#2A2A2A] flex flex-col transition-all duration-200',
        side === 'left' ? 'border-r' : 'border-l',
        !isOpen && 'overflow-visible'
      )}
      style={{ width: shouldShow ? width : 0 }}
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => !isOpen && setIsHovered(false)}
    >
      {shouldShow && (
        <div className={clsx(
          'h-full flex flex-col',
          !isOpen && 'absolute top-0 shadow-2xl z-50',
          !isOpen && side === 'left' && 'left-0',
          !isOpen && side === 'right' && 'right-0'
        )}
          style={{ width: width }}>
          {/* Panel Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-[#2A2A2A] bg-[#1A1A1A]">
            <span className="text-sm font-medium text-white uppercase tracking-wide">
              {title}
            </span>
            <button
              onClick={onToggle}
              className="w-6 h-6 flex items-center justify-center text-[#6A6A6A] hover:text-white rounded transition-colors"
              title={`${isOpen ? 'Collapse' : 'Pin'} ${title}`}
            >
              {side === 'left' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden bg-[#1A1A1A]">
            {children}
          </div>
        </div>
      )}

      {/* Collapsed State Toggle Button */}
      {!shouldShow && (
        <button
          onClick={onToggle}
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-[#2A2A2A] hover:bg-[#3A3A3A] flex items-center justify-center transition-colors z-10',
            side === 'left'
              ? 'left-0 rounded-r-md'
              : 'right-0 rounded-l-md'
          )}
          title={`Expand ${title}`}
        >
          {side === 'left' ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      )}
    </aside>
  );
}

export default CollapsiblePanel;
