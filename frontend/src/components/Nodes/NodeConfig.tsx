import { useState, useCallback } from 'react';
import type { WorkflowNodeData, APINodeData, HeaderConfig, QueryParamConfig } from '@/types';
import { Button, Modal } from '@components/common';
import { SchemaFieldList } from '@components/Schema';

/**
 * Props for NodeConfig component
 */
interface NodeConfigProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeData: WorkflowNodeData;
  onSave: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
}

/**
 * Props for KeyValueEditor
 */
interface KeyValueEditorProps {
  items: Array<{ key: string; value: string; enabled: boolean }>;
  onChange: (items: Array<{ key: string; value: string; enabled: boolean }>) => void;
  label: string;
}

/**
 * KeyValueEditor Component
 *
 * Editor for headers, query params, etc.
 */
function KeyValueEditor({ items, onChange, label }: KeyValueEditorProps): JSX.Element {
  const addItem = useCallback(() => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    },
    [items, onChange]
  );

  const updateItem = useCallback(
    (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
      const newItems = [...items];
      const item = newItems[index];
      if (item) {
        (item as Record<string, string | boolean>)[field] = value;
        onChange(newItems);
      }
    },
    [items, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-primary-400 hover:text-primary-300"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => updateItem(index, 'enabled', e.target.checked)}
              className="rounded border-gray-600"
            />
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={(e) => updateItem(index, 'key', e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
            />
            <input
              type="text"
              placeholder="Value"
              value={item.value}
              onChange={(e) => updateItem(index, 'value', e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-gray-500 hover:text-red-400"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * APINodeConfigContent Component
 *
 * Configuration form for API nodes
 */
function APINodeConfigContent({
  data,
  onChange,
}: {
  data: APINodeData;
  onChange: (data: Partial<APINodeData>) => void;
}): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Label</label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
        />
      </div>

      {/* Method & URL */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
          <select
            value={data.method}
            onChange={(e) => onChange({ method: e.target.value as APINodeData['method'] })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
          <input
            type="text"
            value={data.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 font-mono text-sm"
          />
        </div>
      </div>

      {/* Headers */}
      <KeyValueEditor
        items={data.headers}
        onChange={(headers) => onChange({ headers: headers as HeaderConfig[] })}
        label="Headers"
      />

      {/* Query Params */}
      <KeyValueEditor
        items={data.queryParams}
        onChange={(queryParams) => onChange({ queryParams: queryParams as QueryParamConfig[] })}
        label="Query Parameters"
      />

      {/* Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(data.method) && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Request Body</label>
          <textarea
            value={data.body || ''}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder='{"key": "value"}'
            rows={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 font-mono text-sm"
          />
        </div>
      )}

      {/* Authentication */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Authentication</label>
        <select
          value={data.auth.type}
          onChange={(e) =>
            onChange({
              auth: { ...data.auth, type: e.target.value as APINodeData['auth']['type'] },
            })
          }
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="api-key">API Key</option>
          <option value="basic">Basic Auth</option>
          <option value="oauth2">OAuth 2.0</option>
        </select>
        {/* TODO: Add auth-specific fields based on type */}
      </div>

      {/* Request Body Schema */}
      <div className="border-t border-gray-700 pt-4">
        <SchemaFieldList
          fields={data.requestSchema || []}
          onChange={(requestSchema) => onChange({ requestSchema })}
          title="Request Body Schema"
          description="Define the fields this API expects as input"
        />
      </div>

      {/* Response Schema */}
      <div className="border-t border-gray-700 pt-4">
        <SchemaFieldList
          fields={data.responseSchema || []}
          onChange={(responseSchema) => onChange({ responseSchema })}
          title="Response Schema"
          description="Define the fields this API returns (available to downstream nodes)"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <input
          type="text"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
        />
      </div>
    </div>
  );
}

/**
 * NodeConfig Component
 *
 * Modal for configuring workflow nodes.
 * Renders different configuration forms based on node type.
 *
 * TODO: Implement transform node config
 * TODO: Implement condition node config
 * TODO: Implement input/output node config
 * TODO: Add JSON schema validation
 * TODO: Add field reference picker ({{nodeName.field}})
 */
export function NodeConfig({
  isOpen,
  onClose,
  nodeId,
  nodeData,
  onSave,
}: NodeConfigProps): JSX.Element | null {
  const [formData, setFormData] = useState<WorkflowNodeData>(nodeData);

  /**
   * Handle form data changes
   */
  const handleChange = useCallback((changes: Partial<WorkflowNodeData>) => {
    setFormData((prev) => ({ ...prev, ...changes } as WorkflowNodeData));
  }, []);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    onSave(nodeId, formData);
    onClose();
  }, [nodeId, formData, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Node">
      <div className="p-4">
        {nodeData.nodeType === 'api' && (
          <APINodeConfigContent
            data={formData as APINodeData}
            onChange={handleChange}
          />
        )}

        {/* TODO: Add other node type configs */}
        {nodeData.nodeType === 'transform' && (
          <div className="text-gray-400 text-center py-8">
            Transform node configuration coming soon...
          </div>
        )}
        {nodeData.nodeType === 'condition' && (
          <div className="text-gray-400 text-center py-8">
            Condition node configuration coming soon...
          </div>
        )}
        {nodeData.nodeType === 'input' && (
          <div className="text-gray-400 text-center py-8">
            Input node configuration coming soon...
          </div>
        )}
        {nodeData.nodeType === 'output' && (
          <div className="text-gray-400 text-center py-8">
            Output node configuration coming soon...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

export default NodeConfig;
