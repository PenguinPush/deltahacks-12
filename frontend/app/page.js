'use client';

import { ReactFlowProvider } from 'reactflow';
import ControlPanel from '../components/ControlPanel';
import dynamic from 'next/dynamic';

// Dynamically import client-only components to prevent SSR hydration errors.
// ReactFlow and its related components often rely on browser APIs (like getBoundingClientRect)
// that are not available on the server, leading to mismatches.
const FlowCanvas = dynamic(() => import('../components/FlowCanvas'), { ssr: false });
const ContextMenu = dynamic(() => import('../components/ContextMenu'), { ssr: false });

export default function HomePage() {
  return (
    <ReactFlowProvider>
      <div className="app-container">
        <ControlPanel />
        <main className="flow-container">
          <FlowCanvas />
        </main>
        <ContextMenu />
      </div>
    </ReactFlowProvider>
  );
}