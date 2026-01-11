import { useState, useCallback } from 'react';
import { Button } from '@components/common';

/**
 * Version history entry
 */
interface VersionEntry {
  id: string;
  version: string;
  createdAt: string;
  createdBy?: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Props for VersionHistory component
 */
interface VersionHistoryProps {
  workflowId: string;
  currentVersion: string;
  onPreview?: (version: VersionEntry) => void;
  onRestore?: (version: VersionEntry) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * VersionHistory Component
 *
 * Displays version history for a workflow with preview and restore.
 *
 * TODO: Implement actual version fetching from API
 * TODO: Add diff view between versions
 */
export function VersionHistory({
  workflowId: _workflowId,
  currentVersion,
  onPreview,
  onRestore,
}: VersionHistoryProps): JSX.Element {
  const [_isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Mock data
  const versions: VersionEntry[] = [
    { id: 'v3', version: '1.0.2', createdAt: new Date().toISOString(), description: 'Added error handling', nodeCount: 5, edgeCount: 4 },
    { id: 'v2', version: '1.0.1', createdAt: new Date(Date.now() - 3600000).toISOString(), description: 'Updated API endpoint', nodeCount: 4, edgeCount: 3 },
    { id: 'v1', version: '1.0.0', createdAt: new Date(Date.now() - 86400000).toISOString(), description: 'Initial version', nodeCount: 3, edgeCount: 2 },
  ];

  const handleRestore = useCallback(async (version: VersionEntry) => {
    if (!window.confirm(`Restore to version ${version.version}?`)) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onRestore?.(version);
    } finally {
      setIsLoading(false);
    }
  }, [onRestore]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#2A2A2A]">
        <h3 className="text-sm font-medium text-white">Version History</h3>
        <p className="text-xs text-[#6A6A6A] mt-1">Current: v{currentVersion}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {versions.map((version, index) => (
          <div
            key={version.id}
            onClick={() => { setSelectedVersion(version.id); onPreview?.(version); }}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedVersion === version.id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-[#1E1E1E] hover:bg-[#2A2A2A]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">v{version.version}</span>
              {index === 0 && <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">Latest</span>}
            </div>
            {version.description && <p className="text-xs text-[#A0A0A0] mb-2">{version.description}</p>}
            <div className="text-xs text-[#6A6A6A]">{formatDate(version.createdAt)}</div>
            {selectedVersion === version.id && index !== 0 && (
              <Button variant="secondary" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); handleRestore(version); }}>
                Restore
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VersionHistory;
