import { useState, useCallback } from 'react';
import { useWorkflowStore, useSelectedNode } from '@stores/workflowStore';
import { Button, Input, Select } from '@components/common';
import type { WorkflowNodeData, APINodeData } from '@/types';

/**
 * Custom attribute for nodes
 */
interface CustomAttribute {
  id: string;
  key: string;
  value: string;
}

/**
 * PropertiesPanel Component
 *
 * Right panel for editing selected node properties.
 * Shows different fields based on node type.
 *
 * TODO: Add validation for required fields
 * TODO: Add custom attribute editing
 * TODO: Add node-specific configuration components
 */
export function PropertiesPanel(): JSX.Element {
  const selectedNode = useSelectedNode();
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);

  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      if (!selectedNode) return;
      updateNode(selectedNode.id, { [field]: value } as Partial<WorkflowNodeData>);
    },
    [selectedNode, updateNode]
  );

  /**
   * Handle delete node
   */
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    removeNode(selectedNode.id);
  }, [selectedNode, removeNode]);

  /**
   * Add custom attribute
   */
  const handleAddAttribute = useCallback(() => {
    setCustomAttributes((prev) => [
      ...prev,
      { id: `attr-${Date.now()}`, key: '', value: '' },
    ]);
  }, []);

  /**
   * Remove custom attribute
   */
  const handleRemoveAttribute = useCallback((id: string) => {
    setCustomAttributes((prev) => prev.filter((attr) => attr.id !== id));
  }, []);

  /**
   * Update custom attribute
   */
  const handleUpdateAttribute = useCallback(
    (id: string, field: 'key' | 'value', newValue: string) => {
      setCustomAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id ? { ...attr, [field]: newValue } : attr
        )
      );
    },
    []
  );

  // No node selected state
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#6A6A6A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="text-[#6A6A6A] text-sm">
          Select a node to view and edit its properties
        </p>
      </div>
    );
  }

  const nodeData = selectedNode.data;

  return (
    <div className="h-full flex flex-col">
      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Node Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={nodeData.label}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="Enter node name"
          />
        </div>

        {/* Node Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Node Type
          </label>
          <div className="px-3 py-2 bg-[#1E1E1E] border border-[#3A3A3A] rounded-md text-[#A0A0A0] text-sm capitalize">
            {nodeData.nodeType}
          </div>
        </div>

        {/* API Node Specific Fields */}
        {nodeData.nodeType === 'api' && (
          <APINodeProperties
            data={nodeData as APINodeData}
            onChange={handleFieldChange}
          />
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#3A3A3A] rounded-md text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Custom Attributes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white">
              Custom Attributes
            </label>
            <button
              onClick={handleAddAttribute}
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              + Add
            </button>
          </div>

          {customAttributes.length === 0 ? (
            <p className="text-sm text-[#6A6A6A]">No custom attributes</p>
          ) : (
            <div className="space-y-2">
              {customAttributes.map((attr) => (
                <div key={attr.id} className="flex items-center gap-2">
                  <Input
                    value={attr.key}
                    onChange={(e) =>
                      handleUpdateAttribute(attr.id, 'key', e.target.value)
                    }
                    placeholder="Key"
                    size="sm"
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) =>
                      handleUpdateAttribute(attr.id, 'value', e.target.value)
                    }
                    placeholder="Value"
                    size="sm"
                  />
                  <button
                    onClick={() => handleRemoveAttribute(attr.id)}
                    className="text-[#6A6A6A] hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <Button
          variant="danger"
          fullWidth
          onClick={handleDeleteNode}
        >
          Delete Node
        </Button>
      </div>
    </div>
  );
}

/**
 * API Node specific properties
 */
function APINodeProperties({
  data,
  onChange,
}: {
  data: APINodeData;
  onChange: (field: string, value: unknown) => void;
}): JSX.Element {
  return (
    <>
      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          HTTP Method
        </label>
        <Select
          value={data.method}
          onChange={(e) => onChange('method', e.target.value)}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          URL <span className="text-red-400">*</span>
        </label>
        <Input
          value={data.url}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
        />
      </div>

      {/* Auth Type */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Authentication
        </label>
        <Select
          value={data.auth.type}
          onChange={(e) =>
            onChange('auth', { ...data.auth, type: e.target.value })
          }
          options={[
            { value: 'none', label: 'None' },
            { value: 'bearer', label: 'Bearer Token' },
            { value: 'api-key', label: 'API Key' },
            { value: 'basic', label: 'Basic Auth' },
            { value: 'oauth2', label: 'OAuth 2.0' },
          ]}
        />
      </div>

      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Timeout (ms)
        </label>
        <Input
          type="number"
          value={data.timeout || 30000}
          onChange={(e) => onChange('timeout', parseInt(e.target.value, 10))}
          placeholder="30000"
        />
      </div>
    </>
  );
}

export default PropertiesPanel;
