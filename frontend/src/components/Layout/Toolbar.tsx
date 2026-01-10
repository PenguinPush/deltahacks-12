import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '@components/common';
import { useWorkflow } from '@hooks/useWorkflow';
import { useWorkflowStore } from '@stores/workflowStore';
import { exportCanvasAsPng, exportCanvasAsSvg } from '@utils/exportCanvas';

/**
 * Toolbar Component
 *
 * Top bar with workflow actions: Save, Load, Export JSON/PNG, Clear.
 * Height: 60px per design spec.
 *
 * TODO: Add workflow name editing
 * TODO: Add collaboration status indicator
 * TODO: Add execution controls (Run, Stop)
 */
export function Toolbar(): JSX.Element {
  const navigate = useNavigate();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const { saveWorkflow, isSaving } = useWorkflow();
  const metadata = useWorkflowStore((state) => state.metadata);
  const isModified = useWorkflowStore((state) => state.isModified);
  const clearWorkflow = useWorkflowStore((state) => state.clearWorkflow);

  /**
   * Handle save
   */
  const handleSave = useCallback(async () => {
    try {
      await saveWorkflow();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      // TODO: Show error toast
    }
  }, [saveWorkflow]);

  /**
   * Handle export as JSON
   */
  const handleExportJson = useCallback(() => {
    const definition = useWorkflowStore.getState().saveWorkflow();
    const json = JSON.stringify(definition, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata?.name || 'workflow'}.json`;
    link.click();

    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  }, [metadata?.name]);

  /**
   * Handle export as PNG
   */
  const handleExportPng = useCallback(async () => {
    try {
      await exportCanvasAsPng(metadata?.name || 'workflow');
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error('Failed to export as PNG:', error);
      // TODO: Show error toast
    }
  }, [metadata?.name]);

  /**
   * Handle export as SVG
   */
  const handleExportSvg = useCallback(async () => {
    try {
      await exportCanvasAsSvg(metadata?.name || 'workflow');
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error('Failed to export as SVG:', error);
    }
  }, [metadata?.name]);

  /**
   * Handle clear workflow
   */
  const handleClear = useCallback(() => {
    clearWorkflow();
    setIsClearConfirmOpen(false);
  }, [clearWorkflow]);

  /**
   * Handle go home
   */
  const handleGoHome = useCallback(() => {
    // TODO: Check for unsaved changes
    navigate('/');
  }, [navigate]);

  return (
    <header className="h-[60px] flex items-center justify-between px-4 bg-[#1A1A1A] border-b border-[#2A2A2A]">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Home Button */}
        <button
          onClick={handleGoHome}
          className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] flex items-center justify-center transition-colors"
          title="Go to Dashboard"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Workflow Name */}
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {metadata?.name || 'Untitled Workflow'}
          </span>
          {isModified && (
            <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Center Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isModified}
        >
          Save
        </Button>

        {/* Load Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // TODO: Open load workflow modal
          }}
        >
          Load
        </Button>

        {/* Export Button */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
          >
            Export
            <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>

          {/* Export Dropdown */}
          {isExportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsExportMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-1 w-40 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={handleExportJson}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#3A3A3A] transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={handleExportPng}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#3A3A3A] transition-colors"
                >
                  Export PNG
                </button>
                <button
                  onClick={handleExportSvg}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#3A3A3A] transition-colors"
                >
                  Export SVG
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Clear Button */}
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsClearConfirmOpen(true)}
        >
          Clear
        </Button>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Clear Workflow"
        size="sm"
      >
        <div className="p-4">
          <p className="text-[#A0A0A0] mb-6">
            Are you sure you want to clear the entire workflow? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsClearConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClear}>
              Clear Workflow
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

export default Toolbar;
