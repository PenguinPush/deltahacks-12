/**
 * Mock API Panel - Create and test mock API endpoints
 */

import { useState } from 'react';
import {
  Server,
  Plus,
  Play,
  Trash2,
  Edit2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Globe,
  Shuffle,
  X,
  ExternalLink,
} from 'lucide-react';
import type { MockEndpoint, FakeDataConfig } from '../../types/workflow';

interface MockApiPanelProps {
  onEndpointCreate?: (endpoint: MockEndpoint) => void;
  onEndpointTest?: (endpoint: MockEndpoint) => Promise<unknown>;
}

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  PATCH: 'bg-orange-500/20 text-orange-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

const fakeDataTypes: { type: FakeDataConfig['type']; label: string; example: string }[] = [
  { type: 'name', label: 'Full Name', example: 'John Smith' },
  { type: 'email', label: 'Email', example: 'john@example.com' },
  { type: 'phone', label: 'Phone', example: '+1 555-123-4567' },
  { type: 'address', label: 'Address', example: '123 Main St, NYC' },
  { type: 'uuid', label: 'UUID', example: 'a1b2c3d4-...' },
  { type: 'date', label: 'Date', example: '2024-01-15' },
  { type: 'number', label: 'Number', example: '42' },
  { type: 'boolean', label: 'Boolean', example: 'true/false' },
];

export function MockApiPanel({ onEndpointCreate, onEndpointTest }: MockApiPanelProps) {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<MockEndpoint | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, { success: boolean; data: unknown; time: number }>>(new Map());
  const [testingId, setTestingId] = useState<string | null>(null);

  const generateMockId = () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCreate = (data: Omit<MockEndpoint, 'id' | 'fullUrl'>) => {
    const endpoint: MockEndpoint = {
      ...data,
      id: generateMockId(),
      fullUrl: `https://mock.nodelink.dev${data.path}`,
    };
    setEndpoints(prev => [...prev, endpoint]);
    onEndpointCreate?.(endpoint);
    setShowCreateModal(false);
  };

  const handleUpdate = (id: string, data: Partial<MockEndpoint>) => {
    setEndpoints(prev => prev.map(ep =>
      ep.id === id ? { ...ep, ...data } : ep
    ));
    setEditingEndpoint(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this mock endpoint?')) {
      setEndpoints(prev => prev.filter(ep => ep.id !== id));
    }
  };

  const handleTest = async (endpoint: MockEndpoint) => {
    setTestingId(endpoint.id);
    const startTime = Date.now();

    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, endpoint.delay || 200));

      // Generate response based on scenarios
      let response = endpoint.responseBody;
      if (endpoint.scenarios.length > 0) {
        // Pick random scenario based on probability
        const randomScenario = endpoint.scenarios.find(s =>
          s.probability && Math.random() < (s.probability / 100)
        );
        if (randomScenario) {
          response = randomScenario.responseBody;
        }
      }

      // Process fake data placeholders
      response = processFakeData(response);

      setTestResults(prev => new Map(prev).set(endpoint.id, {
        success: endpoint.responseStatus < 400,
        data: response,
        time: Date.now() - startTime,
      }));

      if (onEndpointTest) {
        await onEndpointTest(endpoint);
      }
    } catch (error) {
      setTestResults(prev => new Map(prev).set(endpoint.id, {
        success: false,
        data: { error: (error as Error).message },
        time: Date.now() - startTime,
      }));
    } finally {
      setTestingId(null);
    }
  };

  const processFakeData = (data: unknown): unknown => {
    if (typeof data === 'string') {
      return data
        .replace(/\{\{name\}\}/g, generateFakeName())
        .replace(/\{\{email\}\}/g, generateFakeEmail())
        .replace(/\{\{uuid\}\}/g, generateFakeUuid())
        .replace(/\{\{number\}\}/g, String(Math.floor(Math.random() * 1000)))
        .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0] ?? '');
    }
    if (Array.isArray(data)) {
      return data.map(processFakeData);
    }
    if (typeof data === 'object' && data !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = processFakeData(value);
      }
      return result;
    }
    return data;
  };

  const generateFakeName = () => {
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const generateFakeEmail = () => {
    const name = generateFakeName().toLowerCase().replace(' ', '.');
    const domains = ['example.com', 'test.org', 'demo.net'];
    return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
  };

  const generateFakeUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-green-400" />
            Mock APIs
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Create mock endpoints to test your workflows
        </p>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto p-4">
        {endpoints.length > 0 ? (
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                isExpanded={expandedEndpoints.has(endpoint.id)}
                isTesting={testingId === endpoint.id}
                testResult={testResults.get(endpoint.id)}
                onToggle={() => toggleEndpoint(endpoint.id)}
                onTest={() => handleTest(endpoint)}
                onEdit={() => setEditingEndpoint(endpoint)}
                onDelete={() => handleDelete(endpoint.id)}
                onCopyUrl={() => copyUrl(endpoint.fullUrl)}
                onToggleEnabled={(enabled) => handleUpdate(endpoint.id, { enabled })}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Server className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">No mock endpoints</p>
            <p className="text-sm text-gray-600 mt-1">Create endpoints to simulate API responses</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Create Endpoint
            </button>
          </div>
        )}
      </div>

      {/* Fake Data Reference */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white">
            <Shuffle className="w-4 h-4" />
            <span>Fake Data Placeholders</span>
            <ChevronRight className="w-4 h-4 ml-auto group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {fakeDataTypes.map(({ type, example }) => (
              <div key={type} className="flex items-center justify-between p-1.5 rounded bg-gray-800/50">
                <code className="text-purple-400">{`{{${type}}}`}</code>
                <span className="text-gray-500">{example}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEndpointModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editingEndpoint && (
        <EditEndpointModal
          endpoint={editingEndpoint}
          onClose={() => setEditingEndpoint(null)}
          onSave={(data) => handleUpdate(editingEndpoint.id, data)}
        />
      )}
    </div>
  );
}

interface EndpointCardProps {
  endpoint: MockEndpoint;
  isExpanded: boolean;
  isTesting: boolean;
  testResult?: { success: boolean; data: unknown; time: number };
  onToggle: () => void;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

function EndpointCard({
  endpoint,
  isExpanded,
  isTesting,
  testResult,
  onToggle,
  onTest,
  onEdit,
  onDelete,
  onCopyUrl,
  onToggleEnabled,
}: EndpointCardProps) {
  return (
    <div
      className={`rounded-lg border transition-all ${!endpoint.enabled
          ? 'border-gray-700 bg-gray-800/30 opacity-60'
          : testResult?.success === false
            ? 'border-red-500/50 bg-red-500/10'
            : testResult?.success
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-gray-700 bg-gray-800/50'
        }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${methodColors[endpoint.method]}`}>
              {endpoint.method}
            </span>
            <span className="font-mono text-sm text-white">{endpoint.path}</span>
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={endpoint.enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-8 h-4 rounded-full transition-colors ${endpoint.enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform mt-0.5 ${endpoint.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                  }`}
              />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span>{endpoint.name}</span>
          <span>•</span>
          <span>Status: {endpoint.responseStatus}</span>
          {endpoint.delay && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {endpoint.delay}ms delay
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            disabled={isTesting || !endpoint.enabled}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
          >
            {isTesting ? (
              <Zap className="w-4 h-4 animate-pulse" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Test
          </button>
          <button
            onClick={onCopyUrl}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700/50 pt-3">
          {/* URL */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Full URL</label>
            <div className="flex items-center gap-2 p-2 bg-black rounded font-mono text-xs">
              <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-gray-300 truncate">{endpoint.fullUrl}</span>
              <a
                href={endpoint.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Response Body */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Response Body</label>
            <pre className="p-2 bg-black rounded text-xs text-gray-300 overflow-x-auto max-h-32">
              {JSON.stringify(endpoint.responseBody, null, 2)}
            </pre>
          </div>

          {/* Scenarios */}
          {endpoint.scenarios.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Scenarios</label>
              <div className="space-y-1">
                {endpoint.scenarios.map((scenario) => (
                  <div key={scenario.id} className="flex items-center justify-between p-2 bg-black rounded text-xs">
                    <span className="text-white">{scenario.name}</span>
                    {scenario.probability && (
                      <span className="text-gray-500">{scenario.probability}% chance</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-2 rounded ${testResult.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`flex items-center gap-1 text-xs ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {testResult.success ? 'Success' : 'Failed'}
                </span>
                <span className="text-xs text-gray-500">{testResult.time}ms</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto max-h-24">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CreateEndpointModalProps {
  onClose: () => void;
  onCreate: (data: Omit<MockEndpoint, 'id' | 'fullUrl'>) => void;
}

function CreateEndpointModal({ onClose, onCreate }: CreateEndpointModalProps) {
  const [name, setName] = useState('');
  const [method, setMethod] = useState<MockEndpoint['method']>('GET');
  const [path, setPath] = useState('/api/');
  const [status, setStatus] = useState(200);
  const [delay, setDelay] = useState(0);
  const [responseBody, setResponseBody] = useState('{\n  "success": true,\n  "data": {}\n}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = JSON.parse(responseBody);
      onCreate({
        name,
        method,
        path,
        responseStatus: status,
        responseHeaders: { 'Content-Type': 'application/json' },
        responseBody: body,
        delay: delay || undefined,
        enabled: true,
        scenarios: [],
      });
    } catch {
      alert('Invalid JSON response body');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Create Mock Endpoint</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Get Users"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as MockEndpoint['method'])}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  {methods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <input
                  type="number"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  min={100}
                  max={599}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Delay (ms)</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  min={0}
                  max={10000}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/users"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Response Body (JSON)</label>
              <textarea
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                className="w-full h-40 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-mono text-sm resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{{name}}, {{email}}, {{uuid}}`} for fake data
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditEndpointModalProps {
  endpoint: MockEndpoint;
  onClose: () => void;
  onSave: (data: Partial<MockEndpoint>) => void;
}

function EditEndpointModal({ endpoint, onClose, onSave }: EditEndpointModalProps) {
  const [name, setName] = useState(endpoint.name);
  const [method, setMethod] = useState(endpoint.method);
  const [path, setPath] = useState(endpoint.path);
  const [status, setStatus] = useState(endpoint.responseStatus);
  const [delay, setDelay] = useState(endpoint.delay || 0);
  const [responseBody, setResponseBody] = useState(JSON.stringify(endpoint.responseBody, null, 2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = JSON.parse(responseBody);
      onSave({
        name,
        method,
        path,
        fullUrl: `https://mock.nodelink.dev${path}`,
        responseStatus: status,
        responseBody: body,
        delay: delay || undefined,
      });
    } catch {
      alert('Invalid JSON response body');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Edit Mock Endpoint</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as MockEndpoint['method'])}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  {methods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <input
                  type="number"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  min={100}
                  max={599}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Delay (ms)</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  min={0}
                  max={10000}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Response Body (JSON)</label>
              <textarea
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                className="w-full h-40 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500 resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MockApiPanel;
