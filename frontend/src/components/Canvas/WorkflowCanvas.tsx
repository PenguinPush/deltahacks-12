import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { APINode } from '@components/Nodes';
import { ConnectionLine } from './ConnectionLine';
import { useWorkflowStore } from '@stores/workflowStore';
import type { WorkflowNode, WorkflowEdge } from '@/types';

/**
 * Custom node types mapping
 */
const nodeTypes: NodeTypes = {
  apiNode: APINode,
  // TODO: Add more node types
  // transformNode: TransformNode,
  // conditionNode: ConditionNode,
  // inputNode: InputNode,
  // outputNode: OutputNode,
};

/**
 * Custom edge types mapping
 */
const edgeTypes: EdgeTypes = {
  // TODO: Add custom edge types if needed
};

/**
 * WorkflowCanvas Component
 *
 * Main React Flow canvas for building visual workflows.
 * Handles node/edge rendering, drag-and-drop, connections, and viewport.
 *
 * TODO: Implement drag-and-drop from palette
 * TODO: Implement copy/paste functionality
 * TODO: Implement undo/redo
 * TODO: Implement keyboard shortcuts
 * TODO: Implement zoom controls
 * TODO: Implement node alignment/snapping
 */
export function WorkflowCanvas(): JSX.Element {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Get state and actions from store
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const addEdge = useWorkflowStore((state) => state.addEdge);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const setViewport = useWorkflowStore((state) => state.setViewport);

  /**
   * Handle nodes state changes (position, selection, removal)
   */
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // TODO: Apply node changes to store
      console.log('Nodes changed:', changes);
    },
    []
  );

  /**
   * Handle edges state changes (selection, removal)
   */
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      // TODO: Apply edge changes to store
      console.log('Edges changed:', changes);
    },
    []
  );

  /**
   * Handle new connections between nodes
   */
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: WorkflowEdge = {
          id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          data: {
            status: 'idle',
          },
        };
        addEdge(newEdge);
      }
    },
    [addEdge]
  );

  /**
   * Handle node selection
   */
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: WorkflowNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  /**
   * Handle canvas click (deselect)
   */
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  /**
   * Handle drag over for node drop
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle node drop from palette
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance.current) return;

      const type = event.dataTransfer.getData('application/nodelink-node-type');
      const dataString = event.dataTransfer.getData('application/nodelink-node-data');

      if (!type || !dataString) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      try {
        const nodeData = JSON.parse(dataString);
        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type,
          position,
          data: nodeData,
        };
        addNode(newNode);
      } catch (error) {
        console.error('Failed to parse node data:', error);
      }
    },
    [addNode]
  );

  /**
   * Handle React Flow initialization
   */
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  /**
   * Handle viewport changes
   */
  const onMoveEnd = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={onInit}
        onMoveEnd={onMoveEnd}
        connectionLineComponent={ConnectionLine}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={16} size={1} />
        <Controls className="bg-canvas-surface border-gray-700" />
        <MiniMap
          className="bg-canvas-surface border-gray-700"
          nodeColor={(_node) => {
            // TODO: Return color based on node type
            return '#3b82f6';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Toolbar Panel */}
        <Panel position="top-right" className="flex gap-2">
          <></>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default WorkflowCanvas;
