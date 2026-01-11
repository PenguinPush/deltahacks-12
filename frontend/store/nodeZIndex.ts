import { create } from 'zustand';

interface NodeZIndexStore {
  nodeZIndices: Record<string, number>;
  maxZIndex: number;
  bringToFront: (nodeId: string) => void;
  resetZIndices: () => void;
}

export const useNodeZIndex = create<NodeZIndexStore>((set) => ({
  nodeZIndices: {},
  maxZIndex: 1,

  bringToFront: (nodeId: string) =>
    set((state) => ({
      maxZIndex: state.maxZIndex + 1,
      nodeZIndices: {
        ...state.nodeZIndices,
        [nodeId]: state.maxZIndex + 1,
      },
    })),

  resetZIndices: () =>
    set({
      nodeZIndices: {},
      maxZIndex: 1,
    }),
}));
