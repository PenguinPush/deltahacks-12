import { useState } from 'react';
import { Toolbar } from './Toolbar';
import { CollapsiblePanel } from './CollapsiblePanel';
import { PropertiesPanel } from './PropertiesPanel';
import { WorkflowCanvas } from '@components/Canvas';
import { NodePalette } from '@components/Canvas';

/**
 * AppLayout Component
 *
 * Three-panel layout for the workflow editor.
 * - Left Panel (280px): Component Library / Node Palette
 * - Main Canvas: React Flow workflow canvas
 * - Right Panel (360px): Node Properties (collapsible)
 *
 * TODO: Add responsive behavior for tablet/mobile
 * TODO: Add panel resize handles
 * TODO: Persist panel states in localStorage
 */
export function AppLayout(): JSX.Element {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Top Bar */}
      <Toolbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component Library */}
        <CollapsiblePanel
          side="left"
          isOpen={isLeftPanelOpen}
          onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          width={280}
          title="Components"
        >
          <NodePalette />
        </CollapsiblePanel>

        {/* Main Canvas */}
        <main className="flex-1 relative">
          <WorkflowCanvas />
        </main>

        {/* Right Panel - Node Properties */}
        <CollapsiblePanel
          side="right"
          isOpen={isRightPanelOpen}
          onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
          width={360}
          title="Node Properties"
        >
          <PropertiesPanel />
        </CollapsiblePanel>
      </div>
    </div>
  );
}

export default AppLayout;
