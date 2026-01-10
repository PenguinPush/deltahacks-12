import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { schemaApi, type SchemaConfig } from '@/services/schemaApi';

/**
 * Props for AddSchemaModal component
 */
interface AddSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchemaCreated: () => void;
}

/**
 * AddSchemaModal Component
 *
 * Modal for adding custom API schemas to MongoDB
 */
export function AddSchemaModal({ isOpen, onClose, onSchemaCreated }: AddSchemaModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'api-key'>('none');
  const [authValue, setAuthValue] = useState('');
  const [category, setCategory] = useState('api');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const config: SchemaConfig = {
        method,
        url,
        description,
        category,
        icon: 'globe',
        headers: [],
        queryParams: [],
        auth: {
          type: authType,
          ...(authType !== 'none' && { value: authValue }),
        },
      };

      // Add Content-Type header for POST/PUT
      if (method === 'POST' || method === 'PUT') {
        config.headers = [{ key: 'Content-Type', value: 'application/json', enabled: true }];
        config.body = '{}';
        config.bodyType = 'json';
      }

      await schemaApi.createSchema('api', name, config, false);

      // Reset form
      setName('');
      setDescription('');
      setMethod('GET');
      setUrl('');
      setAuthType('none');
      setAuthValue('');
      setCategory('api');

      onSchemaCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create schema');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom API" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., GitHub Get User"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this API does"
          />
        </div>

        {/* Method and URL */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                         text-sm text-gray-200
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              required
            />
          </div>
        </div>

        {/* Authentication */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Authentication</label>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                       text-sm text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api-key">API Key</option>
          </select>
        </div>

        {/* Auth Value (if needed) */}
        {authType !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {authType === 'bearer' && 'Token'}
              {authType === 'basic' && 'Username:Password'}
              {authType === 'api-key' && 'API Key'}
            </label>
            <Input
              type="password"
              value={authValue}
              onChange={(e) => setAuthValue(e.target.value)}
              placeholder={
                authType === 'bearer'
                  ? 'your_bearer_token'
                  : authType === 'basic'
                  ? 'username:password'
                  : 'your_api_key'
              }
            />
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                       text-sm text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="api">API Calls</option>
            <option value="transform">Transform</option>
            <option value="logic">Logic</option>
            <option value="ui">UI Components</option>
            <option value="io">Input/Output</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Creating...' : 'Create API Schema'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSchemaModal;
