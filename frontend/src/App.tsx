import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';

/**
 * Main Application Component
 *
 * Provides routing between Dashboard and Editor pages.
 *
 * TODO: Add authentication wrapper
 * TODO: Add error boundary
 * TODO: Add 404 page
 */
function App(): JSX.Element {
  return (
    <Routes>
      {/* Dashboard - Project list */}
      <Route path="/" element={<Dashboard />} />

      {/* Editor - Workflow builder */}
      <Route path="/editor/:id" element={<Editor />} />
      <Route path="/editor" element={<Navigate to="/editor/new" replace />} />

      {/* Shared workflow view */}
      <Route path="/share/:shareId" element={<Editor />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
