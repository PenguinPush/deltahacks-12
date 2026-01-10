import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../lib/store';

const CustomNode = ({ data }) => {
  const { updateNode, updateInputValue, edges, togglePortVisibility, apiSchemas } = useStore();

  const handleNameChange = (e) => {
    updateNode(data.id, { name: e.target.value });
  };

  const handleTemplateChange = (e) => {
    updateNode(data.id, { template: e.target.value });
  };

  // The menu component, rendered conditionally
  const SettingsMenu = () => (
    <div className="node-menu nodrag">
      {/* API Block Specific Settings */}
      {data.type === 'API' && (
        <div className="menu-section">
          <label>API Schema</label>
          <select
            value={data.schema_key}
            onChange={(e) => updateNode(data.id, { schema_key: e.target.value })}
          >
            {Object.entries(apiSchemas).map(([key, schema]) => (
              <option key={key} value={key}>{schema.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Port Visibility Settings */}
      <div className="menu-section">
        <label>Visible Inputs</label>
        {data.inputs.map(port => (
          <div key={`vis-in-${port.key}`} className="menu-item">
            <input
              type="checkbox"
              id={`vis-in-${data.id}-${port.key}`}
              checked={!data.hidden_inputs?.includes(port.key)}
              onChange={() => togglePortVisibility(data.id, port.key, 'input')}
            />
            <label htmlFor={`vis-in-${data.id}-${port.key}`}>{port.key}</label>
          </div>
        ))}
      </div>
      <div className="menu-section">
        <label>Visible Outputs</label>
        {data.outputs.map(port => (
          <div key={`vis-out-${port.key}`} className="menu-item">
            <input
              type="checkbox"
              id={`vis-out-${data.id}-${port.key}`}
              checked={!data.hidden_outputs?.includes(port.key)}
              onChange={() => togglePortVisibility(data.id, port.key, 'output')}
            />
            <label htmlFor={`vis-out-${data.id}-${port.key}`}>{port.key}</label>
          </div>
        ))}
      </div>
    </div>
  );

  // This is the crucial part: render the key, not the object.
  const renderPort = (port, type) => {
    const isConnected = edges.some(edge => 
      (type === 'input' && edge.target === data.id && edge.targetHandle === port.key) ||
      (type === 'output' && edge.source === data.id && edge.sourceHandle === port.key)
    );

    return (
      <div key={port.key} className="port">
        {type === 'input' && <Handle type="target" position={Position.Left} id={port.key} />}
        
        <div className="port-label">
          <span>{port.key}</span>
          <span className="port-type">({port.data_type})</span>
        </div>

        {/* For unconnected inputs, show a manual input field */}
        {type === 'input' && !isConnected && (
          <input
            type="text"
            className="nodrag" // Prevents node dragging when interacting with the input
            defaultValue={
              typeof port.value === 'object' && port.value !== null
                ? JSON.stringify(port.value)
                : port.value || ''
            }
            onChange={(e) => updateInputValue(data.id, port.key, e.target.value)}
            placeholder="Manual Input"
          />
        )}

        {type === 'output' && <Handle type="source" position={Position.Right} id={port.key} />}
      </div>
    );
  };

  return (
    <div className="custom-node">
      <div className="node-header">
        <input 
          type="text" 
          defaultValue={data.name} 
          onBlur={handleNameChange}
          className="nodrag node-name-input"
        />
        <span className="node-type">{data.type}</span>
      </div>

      {data.menu_open && <SettingsMenu />}

      <div className="node-body">
        <div className="node-ports">
          <div className="port-column">
            <div className="port-title">Inputs</div>
            {data.inputs
              .filter(input => !data.hidden_inputs?.includes(input.key))
              .map(input => renderPort(input, 'input'))}
          </div>
          <div className="port-column">
            <div className="port-title">Outputs</div>
            {data.outputs
              .filter(output => !data.hidden_outputs?.includes(output.key))
              .map(output => renderPort(output, 'output'))}
          </div>
        </div>

        {/* Render special controls for specific block types */}
        {data.type === 'STRING_BUILDER' && (
          <div className="node-config">
            <label>Template</label>
            <textarea
              className="nodrag"
              defaultValue={data.template}
              onBlur={handleTemplateChange}
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);