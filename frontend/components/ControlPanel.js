import React, { useRef } from 'react';
import { useStore } from '../lib/store';

const ControlPanel = () => {
  const { addBlock, executeGraph, executionResult, saveProject, loadProject } = useStore();
  const fileInputRef = useRef(null);

  const blockTypes = ['START', 'API', 'LOGIC', 'REACT', 'TRANSFORM', 'STRING_BUILDER'];

  const handleLoadClick = () => {
    // Programmatically click the hidden file input
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        loadProject(projectData);
      } catch (error) {
        console.error("Error parsing project file:", error);
        alert("Invalid project file. Please select a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside className="control-panel">
      <h3>Controls</h3>
      <div className="controls-section">
        <h4>Add Block</h4>
        {blockTypes.map(type => (
          <button key={type} onClick={() => addBlock(type)}>
            Add {type}
          </button>
        ))}
      </div>
      <div className="controls-section">
        <h4>Project</h4>
        <button onClick={saveProject}>Save Project</button>
        <button onClick={handleLoadClick}>Load Project</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".json,application/json"
        />
      </div>
      <div className="controls-section">
        <h4>Execution</h4>
        <button onClick={executeGraph} className="execute-button">
          Run Graph
        </button>
        {executionResult && (
          <div className="results-box">
            <h4>Result</h4>
            <pre>{executionResult}</pre>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ControlPanel;