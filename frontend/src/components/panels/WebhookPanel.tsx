/**
 * Webhook Panel - Configure and manage webhook triggers
 */

import { useState } from 'react';
import {
  Webhook,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Shield,
  Globe,
  X,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { WebhookConfig, WebhookEvent } from '../../types/workflow';

interface WebhookPanelProps {
  workflowId: string;
  onWebhookCreate?: (webhook: WebhookConfig) => void;
  onWebhookUpdate?: (id: string, webhook: Partial<WebhookConfig>) => void;
  onWebhookDelete?: (id: string) => void;
}

const BASE_WEBHOOK_URL = 'https://hooks.nodelink.dev';

export function WebhookPanel({
  workflowId,
  onWebhookCreate,
  onWebhookUpdate,
  onWebhookDelete,
}: WebhookPanelProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<Map<string, WebhookEvent[]>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [expandedWebhooks, setExpandedWebhooks] = useState<Set<string>>(new Set());
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());

  const generateWebhookId = () => `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateSecret = () => `whsec_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`;

  const handleCreate = (data: Omit<WebhookConfig, 'id' | 'endpointUrl' | 'createdAt' | 'triggerCount'>) => {
    const id = generateWebhookId();
    const webhook: WebhookConfig = {
      ...data,
      id,
      endpointUrl: `${BASE_WEBHOOK_URL}/${workflowId}/${id}`,
      createdAt: Date.now(),
      triggerCount: 0,
    };
    setWebhooks(prev => [...prev, webhook]);
    onWebhookCreate?.(webhook);
    setShowCreateModal(false);
  };

  const handleUpdate = (id: string, data: Partial<WebhookConfig>) => {
    setWebhooks(prev => prev.map(wh =>
      wh.id === id ? { ...wh, ...data } : wh
    ));
    onWebhookUpdate?.(id, data);
    setEditingWebhook(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this webhook? This cannot be undone.')) {
      setWebhooks(prev => prev.filter(wh => wh.id !== id));
      onWebhookDelete?.(id);
    }
  };

  const toggleWebhook = (id: string) => {
    setExpandedWebhooks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const simulateWebhookEvent = (webhookId: string) => {
    const event: WebhookEvent = {
      id: `evt_${Date.now()}`,
      webhookId,
      timestamp: Date.now(),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': 'sha256=...' },
      body: { event: 'test', data: { id: 1, message: 'Test webhook event' } },
      sourceIp: '192.168.1.1',
      verified: true,
      processed: true,
    };

    setWebhookEvents(prev => {
      const next = new Map(prev);
      const existing = next.get(webhookId) || [];
      next.set(webhookId, [event, ...existing].slice(0, 10));
      return next;
    });

    setWebhooks(prev => prev.map(wh =>
      wh.id === webhookId
        ? { ...wh, lastTriggered: Date.now(), triggerCount: wh.triggerCount + 1 }
        : wh
    ));
  };

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-orange-400" />
            Webhooks
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Receive HTTP requests to trigger your workflow
        </p>
      </div>

      {/* Webhooks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {webhooks.length > 0 ? (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                events={webhookEvents.get(webhook.id) || []}
                isExpanded={expandedWebhooks.has(webhook.id)}
                isSecretRevealed={revealedSecrets.has(webhook.id)}
                onToggle={() => toggleWebhook(webhook.id)}
                onToggleSecret={() => toggleSecret(webhook.id)}
                onToggleEnabled={(enabled) => handleUpdate(webhook.id, { enabled })}
                onEdit={() => setEditingWebhook(webhook)}
                onDelete={() => handleDelete(webhook.id)}
                onCopy={copyToClipboard}
                onTest={() => simulateWebhookEvent(webhook.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Webhook className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">No webhooks configured</p>
            <p className="text-sm text-gray-600 mt-1">Create a webhook to trigger workflows via HTTP</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Create Webhook
            </button>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white">
            <Shield className="w-4 h-4" />
            <span>Webhook Security</span>
            <ChevronRight className="w-4 h-4 ml-auto group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>• Use HMAC signatures to verify webhook authenticity</p>
            <p>• Configure IP allowlists for additional security</p>
            <p>• Set rate limits to prevent abuse</p>
            <p>• Rotate secrets periodically</p>
          </div>
        </details>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWebhookModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          generateSecret={generateSecret}
          workflowId={workflowId}
        />
      )}

      {/* Edit Modal */}
      {editingWebhook && (
        <EditWebhookModal
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(null)}
          onSave={(data) => handleUpdate(editingWebhook.id, data)}
          generateSecret={generateSecret}
        />
      )}
    </div>
  );
}

interface WebhookCardProps {
  webhook: WebhookConfig;
  events: WebhookEvent[];
  isExpanded: boolean;
  isSecretRevealed: boolean;
  onToggle: () => void;
  onToggleSecret: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
  onTest: () => void;
  formatDate: (timestamp: number) => string;
}

function WebhookCard({
  webhook,
  events,
  isExpanded,
  isSecretRevealed,
  onToggle,
  onToggleSecret,
  onToggleEnabled,
  onEdit,
  onDelete,
  onCopy,
  onTest,
  formatDate,
}: WebhookCardProps) {
  return (
    <div
      className={`rounded-lg border transition-all ${
        !webhook.enabled
          ? 'border-gray-700 bg-gray-800/30 opacity-60'
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
            <Webhook className="w-4 h-4 text-orange-400" />
            <span className="font-medium text-white">{webhook.name}</span>
            {webhook.lastTriggered && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Activity className="w-3 h-3" />
                Active
              </span>
            )}
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={webhook.enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-8 h-4 rounded-full transition-colors ${
                webhook.enabled ? 'bg-orange-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform mt-0.5 ${
                  webhook.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Endpoint URL */}
        <div className="flex items-center gap-2 p-2 bg-gray-900 rounded mb-3">
          <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <code className="text-xs text-gray-300 truncate flex-1">{webhook.endpointUrl}</code>
          <button
            onClick={() => onCopy(webhook.endpointUrl)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Copy URL"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {webhook.triggerCount} triggers
          </span>
          {webhook.lastTriggered && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last: {formatDate(webhook.lastTriggered)}
            </span>
          )}
          {webhook.rateLimit && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {webhook.rateLimit}/min
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            disabled={!webhook.enabled}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Test
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
          {/* Secret */}
          {webhook.secret && (
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Signing Secret</label>
              <div className="flex items-center gap-2 p-2 bg-gray-900 rounded">
                <Shield className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <code className="text-xs text-gray-300 truncate flex-1">
                  {isSecretRevealed ? webhook.secret : '••••••••••••••••••••••'}
                </code>
                <button
                  onClick={onToggleSecret}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title={isSecretRevealed ? 'Hide' : 'Reveal'}
                >
                  {isSecretRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onCopy(webhook.secret!)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Configuration */}
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            {webhook.signatureAlgorithm && (
              <div className="p-2 bg-gray-900 rounded">
                <span className="text-gray-500">Algorithm:</span>{' '}
                <span className="text-white">{webhook.signatureAlgorithm}</span>
              </div>
            )}
            {webhook.signatureHeader && (
              <div className="p-2 bg-gray-900 rounded">
                <span className="text-gray-500">Header:</span>{' '}
                <span className="text-white">{webhook.signatureHeader}</span>
              </div>
            )}
            {webhook.allowedIps && webhook.allowedIps.length > 0 && (
              <div className="p-2 bg-gray-900 rounded col-span-2">
                <span className="text-gray-500">Allowed IPs:</span>{' '}
                <span className="text-white">{webhook.allowedIps.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Recent Events */}
          {events.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-2">Recent Events</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-2 rounded text-xs ${
                      event.verified ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {event.verified ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-gray-300">{event.method}</span>
                      <span className="text-gray-500">from {event.sourceIp}</span>
                    </div>
                    <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CreateWebhookModalProps {
  onClose: () => void;
  onCreate: (data: Omit<WebhookConfig, 'id' | 'endpointUrl' | 'createdAt' | 'triggerCount'>) => void;
  generateSecret: () => string;
  workflowId: string;
}

function CreateWebhookModal({ onClose, onCreate, generateSecret, workflowId }: CreateWebhookModalProps) {
  const [name, setName] = useState('');
  const [secret, setSecret] = useState(generateSecret());
  const [signatureAlgorithm, setSignatureAlgorithm] = useState<WebhookConfig['signatureAlgorithm']>('hmac-sha256');
  const [signatureHeader, setSignatureHeader] = useState('X-Webhook-Signature');
  const [rateLimit, setRateLimit] = useState(60);
  const [allowedIps, setAllowedIps] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      workflowId,
      name,
      enabled: true,
      secret,
      signatureAlgorithm,
      signatureHeader,
      rateLimit,
      allowedIps: allowedIps ? allowedIps.split(',').map(ip => ip.trim()) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Create Webhook</h3>
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
              placeholder="Payment webhook"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-300">Signing Secret</label>
              <button
                type="button"
                onClick={() => setSecret(generateSecret())}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Regenerate
              </button>
            </div>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Algorithm</label>
              <select
                value={signatureAlgorithm}
                onChange={(e) => setSignatureAlgorithm(e.target.value as WebhookConfig['signatureAlgorithm'])}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="hmac-sha256">HMAC-SHA256</option>
                <option value="hmac-sha1">HMAC-SHA1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rate Limit</label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                min={1}
                max={1000}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Signature Header</label>
            <input
              type="text"
              value={signatureHeader}
              onChange={(e) => setSignatureHeader(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Allowed IPs (optional)</label>
            <input
              type="text"
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="192.168.1.1, 10.0.0.0/8"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated IP addresses or CIDR ranges</p>
          </div>

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
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditWebhookModalProps {
  webhook: WebhookConfig;
  onClose: () => void;
  onSave: (data: Partial<WebhookConfig>) => void;
  generateSecret: () => string;
}

function EditWebhookModal({ webhook, onClose, onSave, generateSecret }: EditWebhookModalProps) {
  const [name, setName] = useState(webhook.name);
  const [secret, setSecret] = useState(webhook.secret || '');
  const [signatureAlgorithm, setSignatureAlgorithm] = useState(webhook.signatureAlgorithm);
  const [signatureHeader, setSignatureHeader] = useState(webhook.signatureHeader || '');
  const [rateLimit, setRateLimit] = useState(webhook.rateLimit || 60);
  const [allowedIps, setAllowedIps] = useState(webhook.allowedIps?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      secret,
      signatureAlgorithm,
      signatureHeader,
      rateLimit,
      allowedIps: allowedIps ? allowedIps.split(',').map(ip => ip.trim()) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-app-panel border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Edit Webhook</h3>
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
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-300">Signing Secret</label>
              <button
                type="button"
                onClick={() => setSecret(generateSecret())}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Regenerate
              </button>
            </div>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Algorithm</label>
              <select
                value={signatureAlgorithm}
                onChange={(e) => setSignatureAlgorithm(e.target.value as WebhookConfig['signatureAlgorithm'])}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="hmac-sha256">HMAC-SHA256</option>
                <option value="hmac-sha1">HMAC-SHA1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rate Limit</label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                min={1}
                max={1000}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Signature Header</label>
            <input
              type="text"
              value={signatureHeader}
              onChange={(e) => setSignatureHeader(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Allowed IPs</label>
            <input
              type="text"
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="192.168.1.1, 10.0.0.0/8"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

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
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WebhookPanel;
