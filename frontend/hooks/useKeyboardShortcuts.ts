import { useEffect, useCallback, useMemo } from 'react';
import { useWorkflowStore } from '@stores/workflowStore';
import { useUndoRedo } from './useUndoRedo';

/**
 * Keyboard shortcut definition
 */
interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * useKeyboardShortcuts Hook
 *
 * Registers and handles keyboard shortcuts for the workflow editor.
 *
 * Shortcuts:
 * - Cmd/Ctrl + S: Save
 * - Cmd/Ctrl + Z: Undo
 * - Cmd/Ctrl + Shift + Z: Redo
 * - Delete/Backspace: Delete selected
 * - Escape: Deselect all
 * - Cmd/Ctrl + D: Duplicate selected
 * - Cmd/Ctrl + A: Select all
 *
 * TODO: Add customizable shortcuts
 * TODO: Add shortcut help modal
 */
export function useKeyboardShortcuts(): void {
  const { undo, redo } = useUndoRedo();

  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    const definition = useWorkflowStore.getState().saveWorkflow();
    console.log('Saving workflow...', definition);
    // TODO: Trigger actual save via API
  }, []);

  /**
   * Handle delete
   */
  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
    }
  }, [selectedNodeId, removeNode]);

  /**
   * Handle duplicate
   */
  const handleDuplicate = useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  }, [selectedNodeId, duplicateNode]);

  /**
   * Handle deselect
   */
  const handleDeselect = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  /**
   * Define shortcuts
   */
  const shortcuts: Shortcut[] = useMemo(() => [
    { key: 's', meta: true, action: handleSave, description: 'Save workflow' },
    { key: 's', ctrl: true, action: handleSave, description: 'Save workflow' },
    { key: 'z', meta: true, action: undo, description: 'Undo' },
    { key: 'z', ctrl: true, action: undo, description: 'Undo' },
    { key: 'z', meta: true, shift: true, action: redo, description: 'Redo' },
    { key: 'z', ctrl: true, shift: true, action: redo, description: 'Redo' },
    { key: 'y', meta: true, action: redo, description: 'Redo' },
    { key: 'y', ctrl: true, action: redo, description: 'Redo' },
    { key: 'Delete', action: handleDelete, description: 'Delete selected' },
    { key: 'Backspace', action: handleDelete, description: 'Delete selected' },
    { key: 'Escape', action: handleDeselect, description: 'Deselect' },
    { key: 'd', meta: true, action: handleDuplicate, description: 'Duplicate selected' },
    { key: 'd', ctrl: true, action: handleDuplicate, description: 'Duplicate selected' },
  ], [handleSave, undo, redo, handleDelete, handleDeselect, handleDuplicate]);

  /**
   * Handle keydown event
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey || shortcut.meta;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey || shortcut.ctrl;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For Delete/Backspace, don't require modifier keys
        const isDeleteKey = shortcut.key === 'Delete' || shortcut.key === 'Backspace';
        const modifierMatch = isDeleteKey || (ctrlMatch && metaMatch && shiftMatch && altMatch);

        if (keyMatch && modifierMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
