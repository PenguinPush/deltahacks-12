import { memo } from 'react';
import type { WorkflowListItem } from '@/types';

/**
 * Props for ProjectCard component
 */
interface ProjectCardProps {
  /** Project/workflow data */
  project: WorkflowListItem;
  /** Called when the card is clicked */
  onClick: () => void;
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/**
 * ProjectCard Component
 *
 * Card displaying a workflow project in the dashboard grid.
 * Shows thumbnail, name, metadata, and open action.
 *
 * TODO: Add thumbnail preview rendering
 * TODO: Add context menu (duplicate, delete, share)
 * TODO: Add hover preview animation
 */
function ProjectCardComponent({ project, onClick }: ProjectCardProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="group bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden cursor-pointer hover:border-[#3A3A3A] transition-all"
    >
      {/* Thumbnail Area */}
      <div className="h-[180px] bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] relative flex items-center justify-center">
        {/* Placeholder Grid */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#2A2A2A" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Placeholder Nodes */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-8 rounded bg-[#3B82F6]/30 border border-[#3B82F6]/50" />
          <div className="w-8 h-0.5 bg-[#4A4A4A]" />
          <div className="w-12 h-8 rounded bg-[#10B981]/30 border border-[#10B981]/50" />
          <div className="w-8 h-0.5 bg-[#4A4A4A]" />
          <div className="w-12 h-8 rounded bg-[#8B5CF6]/30 border border-[#8B5CF6]/50" />
        </div>

        {/* Node Count Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-[#2A2A2A]/80 rounded text-xs text-[#A0A0A0]">
          {project.nodeCount} nodes
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-medium truncate flex-1">
            {project.name}
          </h3>
          {/* Options Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open context menu
            }}
            className="p-1 text-[#6A6A6A] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-[#6A6A6A] mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-[#6A6A6A] mb-4">
          <span>{formatRelativeTime(project.updatedAt)}</span>
          {project.status && (
            <>
              <span>•</span>
              <span className="capitalize">{project.status}</span>
            </>
          )}
        </div>

        {/* Open Button */}
        <button
          onClick={onClick}
          className="w-full py-2 px-4 bg-transparent border border-[#3A3A3A] rounded-md text-sm text-white hover:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2"
        >
          Open Project
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export const ProjectCard = memo(ProjectCardComponent);

export default ProjectCard;
