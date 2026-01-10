/**
 * Credential Panel - Manage API credentials and authentication
 */

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  RefreshCw,
  X,
  Lock,
} from 'lucide-react';
import type { Credential, CredentialType, CredentialData } from '../../types/workflow';
import { credentialManager } from '../../services/credentialManager';

interface CredentialPanelProps {
  onCredentialSelect?: (credential: Credential) => void;
  selectedServiceId?: string;
}

const credentialTypeLabels: Record<CredentialType, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic_auth: 'Basic Auth',
  bearer_token: 'Bearer Token',
  custom: 'Custom',
};

const credentialTypeIcons: Record<CredentialType, React.ReactNode> = {
  api_key: <Key className="w-4 h-4" />,
  oauth2: <Shield className="w-4 h-4" />,
  basic_auth: <Lock className="w-4 h-4" />,
  bearer_token: <Shield className="w-4 h-4" />,
  custom: <Key className="w-4 h-4" />,
};

export function CredentialPanel({ onCredentialSelect, selectedServiceId }: CredentialPanelProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const creds = selectedServiceId
      ? credentialManager.getByService(selectedServiceId)
      : credentialManager.getAll();
    setCredentials(creds);
  }, [selectedServiceId]);

  const loadCredentials = () => {
    const creds = selectedServiceId
      ? credentialManager.getByService(selectedServiceId)
      : credentialManager.getAll();
    setCredentials(creds);
  };

  const handleCreate = (data: CreateCredentialData) => {
    credentialManager.store(
      data.name,
      data.type,
      data.serviceId,
      data.serviceName,
      data.credentials
    );
    loadCredentials();
    setShowCreateModal(false);
  };

  const handleUpdate = (id: string, data: Partial<{ name: string; data: CredentialData }>) => {
    credentialManager.update(id, data);
    loadCredentials();
    setEditingCredential(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      credentialManager.delete(id);
      loadCredentials();
    }
  };

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    const result = await credentialManager.validate(id);
    loadCredentials();
    setValidatingId(null);

    if (!result.valid) {
      alert(result.message);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Credentials
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {selectedServiceId && (
          <p className="text-sm text-gray-400">
            Showing credentials for: <span className="text-white">{selectedServiceId}</span>
          </p>
        )}
      </div>

      {/* Credentials List */}
      <div className="flex-1 overflow-y-auto p-4">
        {credentials.length > 0 ? (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                isRevealed={revealedIds.has(cred.id)}
                isValidating={validatingId === cred.id}
                onToggleReveal={() => toggleReveal(cred.id)}
                onValidate={() => handleValidate(cred.id)}
                onEdit={() => setEditingCredential(cred)}
                onDelete={() => handleDelete(cred.id)}
                onSelect={() => onCredentialSelect?.(cred)}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Key className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">No credentials stored</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Add Credential
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCredentialModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          defaultServiceId={selectedServiceId}
        />
      )}

      {/* Edit Modal */}
      {editingCredential && (
        <EditCredentialModal
          credential={editingCredential}
          onClose={() => setEditingCredential(null)}
          onSave={(data) => handleUpdate(editingCredential.id, data)}
        />
      )}
    </div>
  );
}

interface CredentialCardProps {
  credential: Credential;
  isRevealed: boolean;
  isValidating: boolean;
  onToggleReveal: () => void;
  onValidate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  formatDate: (timestamp: number) => string;
}

function CredentialCard({
  credential,
  isRevealed,
  isValidating,
  onToggleReveal,
  onValidate,
  onEdit,
  onDelete,
  onSelect,
  formatDate,
}: CredentialCardProps) {
  const maskedPreview = credentialManager.getMaskedPreview(credential.id);

  return (
    <div
      className={`rounded-lg border transition-all ${credential.isValid === false
          ? 'border-red-500/50 bg-red-500/10'
          : credential.isValid
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-gray-700 bg-gray-800/50'
        }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">
              {credentialTypeIcons[credential.type]}
            </span>
            <div>
              <h4 className="font-medium text-white">{credential.name}</h4>
              <p className="text-xs text-gray-400">
                {credential.serviceName} • {credentialTypeLabels[credential.type]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {credential.isValid === true && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {credential.isValid === false && (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        {/* Masked Preview */}
        {Object.keys(maskedPreview).length > 0 && (
          <div className="mb-3 p-2 bg-black rounded text-xs font-mono">
            {Object.entries(maskedPreview).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-gray-500">{key}:</span>
                <span className="text-gray-300">{isRevealed ? value : '••••••••'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created {formatDate(credential.createdAt)}
          </span>
          {credential.lastUsed && (
            <span>Last used {formatDate(credential.lastUsed)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium transition-colors"
          >
            Use
          </button>
          <button
            onClick={onToggleReveal}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title={isRevealed ? 'Hide' : 'Reveal'}
          >
            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={onValidate}
            disabled={isValidating}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50"
            title="Validate"
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
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
    </div>
  );
}

interface CreateCredentialData {
  name: string;
  type: CredentialType;
  serviceId: string;
  serviceName: string;
  credentials: CredentialData;
}

interface CreateCredentialModalProps {
  onClose: () => void;
  onCreate: (data: CreateCredentialData) => void;
  defaultServiceId?: string;
}

function CreateCredentialModal({ onClose, onCreate, defaultServiceId }: CreateCredentialModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CredentialType>('api_key');
  const [serviceId, setServiceId] = useState(defaultServiceId || '');
  const [serviceName, setServiceName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const credentials: CredentialData = {};
    switch (type) {
      case 'api_key':
        credentials.apiKey = apiKey;
        break;
      case 'basic_auth':
        credentials.username = username;
        credentials.password = password;
        break;
      case 'bearer_token':
        credentials.accessToken = accessToken;
        break;
      case 'oauth2':
        credentials.accessToken = accessToken;
        break;
    }

    onCreate({
      name,
      type,
      serviceId,
      serviceName: serviceName || serviceId,
      credentials,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Add Credential</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Key"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CredentialType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(credentialTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Service ID</label>
              <input
                type="text"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="stripe"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Stripe"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {type === 'api_key' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {type === 'basic_auth' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          {(type === 'bearer_token' || type === 'oauth2') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditCredentialModalProps {
  credential: Credential;
  onClose: () => void;
  onSave: (data: Partial<{ name: string; data: CredentialData }>) => void;
}

function EditCredentialModal({ credential, onClose, onSave }: EditCredentialModalProps) {
  const [name, setName] = useState(credential.name);
  const existingData = credentialManager.getData(credential.id) || {};
  const [apiKey, setApiKey] = useState(existingData.apiKey || '');
  const [username, setUsername] = useState(existingData.username || '');
  const [password, setPassword] = useState(existingData.password || '');
  const [accessToken, setAccessToken] = useState(existingData.accessToken || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CredentialData = {};
    switch (credential.type) {
      case 'api_key':
        if (apiKey) data.apiKey = apiKey;
        break;
      case 'basic_auth':
        if (username) data.username = username;
        if (password) data.password = password;
        break;
      case 'bearer_token':
      case 'oauth2':
        if (accessToken) data.accessToken = accessToken;
        break;
    }

    onSave({
      name: name !== credential.name ? name : undefined,
      data: Object.keys(data).length > 0 ? data : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Edit Credential</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <p className="text-sm text-gray-400">
            Leave fields empty to keep existing values
          </p>

          {credential.type === 'api_key' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter new API key"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {credential.type === 'basic_auth' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {(credential.type === 'bearer_token' || credential.type === 'oauth2') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter new access token"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CredentialPanel;
