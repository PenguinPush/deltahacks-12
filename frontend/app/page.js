'use client';

import { ReactFlowProvider } from 'reactflow';
import ControlPanel from '../components/ControlPanel';
import TopBar from '../components/TopBar';
import dynamic from 'next/dynamic';
import ExecutionLog from '../components/ExecutionLog';

// Dynamically import client-only components to prevent SSR hydration errors.
// ReactFlow and its related components often rely on browser APIs (like getBoundingClientRect)
// that are not available on the server, leading to mismatches.
const FlowCanvas = dynamic(() => import('../components/FlowCanvas'), { ssr: false });

export default function HomePage() {
  return (
    <ReactFlowProvider>
      <div className="app-layout">
        <ControlPanel />
        <div className="main-content">
          <TopBar />
          <main className="flow-container">
            <FlowCanvas />
            <ExecutionLog />
          </main>
        </div>
      </div>
    </ReactFlowProvider>
  );
}