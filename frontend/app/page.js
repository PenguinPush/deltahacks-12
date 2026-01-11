'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ReactFlowProvider } from 'reactflow';
import ControlPanel from '../components/ControlPanel';
import dynamic from 'next/dynamic';
import ExecutionLog from '../components/ExecutionLog';

// Dynamically import client-only components to prevent SSR hydration errors.
// ReactFlow and its related components often rely on browser APIs (like getBoundingClientRect)
// that are not available on the server, leading to mismatches.
const FlowCanvas = dynamic(() => import('../components/FlowCanvas'), { ssr: false });

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ReactFlowProvider>
      <div className="app-layout">
        <ControlPanel />
        <div className="main-content">
          <main className="flow-container">
            <FlowCanvas />
        </div>
        <ExecutionLog />
      </div>
    </div>
    </ReactFlowProvider >
  );
}
