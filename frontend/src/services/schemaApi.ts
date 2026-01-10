import { get, post, put, del } from './api';
import type { NodeTemplate } from '@/types';

/**
 * Schema API Service
 *
 * Handles all API calls related to node schemas.
 */

export interface SchemaConfig {
  // For API schemas
  method?: string;
  url?: string;
  headers?: Array<{ key: string; value: string; enabled: boolean }>;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  body?: string;
  bodyType?: string;
  auth?: {
    type: string;
    [key: string]: any;
  };

  // For node templates
  nodeType?: string;
  executionType?: string;
  defaultData?: any;
  handles?: any[];

  // Common
  icon?: string;
  description?: string;
  category?: string;
}

export interface Schema {
  _id: string;
  schema_type: 'api' | 'node_template' | 'integration';
  name: string;
  config: SchemaConfig;
  user_id?: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export const schemaApi = {
  /**
   * Get all schemas (global + user's private)
   */
  async listSchemas(type?: string): Promise<Schema[]> {
    const params = type ? `?type=${type}` : '';
    const response = await get<{ schemas: Schema[] }>(`/schemas${params}`);
    return response.schemas;
  },

  /**
   * Create a new schema
   */
  async createSchema(
    schemaType: 'api' | 'node_template' | 'integration',
    name: string,
    config: SchemaConfig,
    isGlobal: boolean = false
  ): Promise<Schema> {
    const response = await post<Schema>('/schemas', {
      schema_type: schemaType,
      name,
      config,
      is_global: isGlobal,
    });
    return response;
  },

  /**
   * Update a schema
   */
  async updateSchema(schemaId: string, updates: Partial<Schema>): Promise<void> {
    await put(`/schemas/${schemaId}`, updates);
  },

  /**
   * Delete a schema
   */
  async deleteSchema(schemaId: string): Promise<void> {
    await del(`/schemas/${schemaId}`);
  },

  /**
   * Convert schemas to node templates for the palette
   */
  convertSchemasToNodeTemplates(schemas: Schema[]): NodeTemplate[] {
    return schemas
      .filter((schema) => schema.schema_type === 'node_template' || schema.schema_type === 'api')
      .map((schema) => {
        const config = schema.config;

        // For API schemas
        if (schema.schema_type === 'api') {
          return {
            id: `schema-${schema._id}`,
            type: 'api',
            label: schema.name,
            icon: config.icon || 'globe',
            description: config.description || `Custom API: ${schema.name}`,
            category: config.category || 'api',
            handles: config.handles || [
              {
                id: 'input',
                type: 'target',
                dataType: 'any',
                label: 'Input',
                position: 'left',
              },
              {
                id: 'output',
                type: 'source',
                dataType: 'object',
                label: 'Response',
                position: 'right',
              },
            ],
            defaultData: {
              label: schema.name,
              nodeType: 'api',
              executionType: 'action',
              method: config.method || 'GET',
              url: config.url || '',
              headers: config.headers || [],
              queryParams: config.queryParams || [],
              body: config.body,
              bodyType: config.bodyType,
              auth: config.auth || { type: 'none' },
              requestSchema: [],
              responseSchema: [],
              fieldMappings: {},
            },
          };
        }

        // For node templates
        return {
          id: `schema-${schema._id}`,
          type: (config.nodeType as any) || 'transform',
          label: schema.name,
          icon: config.icon || 'box',
          description: config.description || schema.name,
          category: config.category || 'transform',
          handles: config.handles || [],
          defaultData: config.defaultData || {
            label: schema.name,
            nodeType: config.nodeType || 'transform',
            executionType: config.executionType || 'transform',
          },
        };
      });
  },
};

export default schemaApi;
