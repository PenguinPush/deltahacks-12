import React, { useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../lib/store';
import CustomNode from './CustomNode';

const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchGraph, fetchApiSchemas, openContextMenu, closeContextMenu } = useStore();

  // Define our custom node type
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Fetch the initial graph state and schemas when the component mounts
  useEffect(() => {
    fetchGraph();
    fetchApiSchemas();
  }, [fetchGraph, fetchApiSchemas]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeContextMenu={openContextMenu}
        onPaneClick={closeContextMenu}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;