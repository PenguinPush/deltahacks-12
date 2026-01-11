import { useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@stores/workflowStore';
import { workflowApi } from '@services/workflowApi';

/**
 * Auto-save configuration
 */
interface AutoSaveConfig {
  /** Delay in ms before auto-saving after changes */
  debounceMs?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * useAutoSave Hook
 *
 * Automatically saves workflow changes after a debounce period.
 *
 * TODO: Add offline queue for failed saves
 * TODO: Add conflict detection
 * TODO: Add save status indicator
 */
export function useAutoSave(config: AutoSaveConfig = {}): {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
} {
  const {
    debounceMs = 5000,
    enabled = true,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = config;

  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isModified = useWorkflowStore((state) => state.isModified);
  const metadata = useWorkflowStore((state) => state.metadata);

  /**
   * Perform the save
   */
  const performSave = useCallback(async () => {
    if (isSavingRef.current || !metadata) return;

    isSavingRef.current = true;
    onSaveStart?.();

    try {
      const definition = useWorkflowStore.getState().saveWorkflow();
      await workflowApi.saveWorkflow(definition);
      lastSavedRef.current = new Date();
      onSaveComplete?.();
    } catch (error) {
      onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
    } finally {
      isSavingRef.current = false;
    }
  }, [metadata, onSaveStart, onSaveComplete, onSaveError]);

  /**
   * Schedule auto-save when modified
   */
  useEffect(() => {
    if (!enabled || !isModified) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(performSave, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, isModified, debounceMs, performSave]);

  /**
   * Save before unload
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isModified]);

  return {
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
    saveNow: performSave,
  };
}

export default useAutoSave;
