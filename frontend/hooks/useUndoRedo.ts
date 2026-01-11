import { useCallback, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@stores/workflowStore';
import type { WorkflowNode, WorkflowEdge } from '@/types';

/**
 * History state snapshot
 */
interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: number;
}

/**
 * Undo/Redo configuration
 */
interface UndoRedoConfig {
  /** Maximum history size */
  maxHistory?: number;
  /** Debounce time for grouping changes */
  debounceMs?: number;
}

/**
 * useUndoRedo Hook
 *
 * Provides undo/redo functionality for workflow changes.
 *
 * TODO: Add action descriptions for history
 * TODO: Add history visualization
 * TODO: Persist history to localStorage
 */
export function useUndoRedo(config: UndoRedoConfig = {}): {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;
} {
  const { maxHistory = 50, debounceMs = 500 } = config;

  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  /**
   * Push current state to history
   */
  const pushState = useCallback(() => {
    if (isUndoRedoRef.current) return;

    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    };

    // Remove any future states if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(newState);
    currentIndexRef.current = historyRef.current.length - 1;

    // Trim history if too long
    if (historyRef.current.length > maxHistory) {
      historyRef.current = historyRef.current.slice(-maxHistory);
      currentIndexRef.current = historyRef.current.length - 1;
    }
  }, [nodes, edges, maxHistory]);

  /**
   * Debounced state push
   */
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(pushState, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, edges, pushState, debounceMs]);

  /**
   * Restore a history state
   */
  const restoreState = useCallback((state: HistoryState) => {
    isUndoRedoRef.current = true;

    const store = useWorkflowStore.getState();

    // Clear and restore nodes
    store.nodes.forEach((node) => store.removeNode(node.id));
    state.nodes.forEach((node) => store.addNode(node));

    // Clear and restore edges
    store.edges.forEach((edge) => store.removeEdge(edge.id));
    state.edges.forEach((edge) => store.addEdge(edge));

    // Reset flag after a tick
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 0);
  }, []);

  /**
   * Undo action
   */
  const undo = useCallback(() => {
    if (currentIndexRef.current <= 0) return;

    currentIndexRef.current -= 1;
    const state = historyRef.current[currentIndexRef.current];
    if (state) {
      restoreState(state);
    }
  }, [restoreState]);

  /**
   * Redo action
   */
  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return;

    currentIndexRef.current += 1;
    const state = historyRef.current[currentIndexRef.current];
    if (state) {
      restoreState(state);
    }
  }, [restoreState]);

  return {
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
    historyLength: historyRef.current.length,
    currentIndex: currentIndexRef.current,
  };
}

export default useUndoRedo;
