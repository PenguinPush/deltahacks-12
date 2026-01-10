import type { NodeTemplate, NodeCategory, NodeHandle, NodeType } from '@/types';

/**
 * Node Categories
 *
 * Categories for organizing nodes in the palette
 */
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'api',
    label: 'API Calls',
    icon: 'globe',
    description: 'HTTP request nodes for calling external APIs',
  },
  {
    id: 'transform',
    label: 'Transform',
    icon: 'shuffle',
    description: 'Data transformation and mapping nodes',
  },
  {
    id: 'logic',
    label: 'Logic',
    icon: 'git-branch',
    description: 'Conditional branching and logic nodes',
  },
  {
    id: 'ui',
    label: 'UI Components',
    icon: 'layout',
    description: 'User interface and display nodes',
  },
  {
    id: 'io',
    label: 'Input/Output',
    icon: 'terminal',
    description: 'Workflow input and output nodes',
  },
];

/**
 * Default handles for different node types
 */
export const DEFAULT_HANDLES: Record<NodeType, NodeHandle[]> = {
  api: [
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
  transform: [
    {
      id: 'input',
      type: 'target',
      dataType: 'any',
      label: 'Input',
      required: true,
      position: 'left',
    },
    {
      id: 'output',
      type: 'source',
      dataType: 'any',
      label: 'Output',
      position: 'right',
    },
  ],
  condition: [
    {
      id: 'input',
      type: 'target',
      dataType: 'any',
      label: 'Input',
      required: true,
      position: 'left',
    },
    {
      id: 'true',
      type: 'source',
      dataType: 'any',
      label: 'True',
      position: 'right',
    },
    {
      id: 'false',
      type: 'source',
      dataType: 'any',
      label: 'False',
      position: 'right',
    },
  ],
  input: [
    {
      id: 'output',
      type: 'source',
      dataType: 'any',
      label: 'Output',
      position: 'right',
    },
  ],
  output: [
    {
      id: 'input',
      type: 'target',
      dataType: 'any',
      label: 'Input',
      required: true,
      position: 'left',
    },
  ],
};

/**
 * Node Templates for the Palette
 *
 * These are the draggable node templates that users can add to the canvas
 */
export const NODE_TEMPLATES: NodeTemplate[] = [
  // API Nodes
  {
    id: 'http-get',
    type: 'api',
    label: 'HTTP GET',
    icon: 'download',
    description: 'Make a GET request to an API endpoint',
    category: 'api',
    handles: DEFAULT_HANDLES.api,
    defaultData: {
      label: 'HTTP GET',
      nodeType: 'api',
      executionType: 'action',
      method: 'GET',
      url: '',
      headers: [],
      queryParams: [],
      auth: { type: 'none' },
      requestSchema: [],
      responseSchema: [],
      fieldMappings: {},
    },
  },
  {
    id: 'http-post',
    type: 'api',
    label: 'HTTP POST',
    icon: 'upload',
    description: 'Make a POST request to an API endpoint',
    category: 'api',
    handles: DEFAULT_HANDLES.api,
    defaultData: {
      label: 'HTTP POST',
      nodeType: 'api',
      executionType: 'action',
      method: 'POST',
      url: '',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      queryParams: [],
      body: '{}',
      bodyType: 'json',
      auth: { type: 'none' },
      requestSchema: [],
      responseSchema: [],
      fieldMappings: {},
    },
  },
  {
    id: 'http-put',
    type: 'api',
    label: 'HTTP PUT',
    icon: 'edit',
    description: 'Make a PUT request to an API endpoint',
    category: 'api',
    handles: DEFAULT_HANDLES.api,
    defaultData: {
      label: 'HTTP PUT',
      nodeType: 'api',
      executionType: 'action',
      method: 'PUT',
      url: '',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      queryParams: [],
      body: '{}',
      bodyType: 'json',
      auth: { type: 'none' },
      requestSchema: [],
      responseSchema: [],
      fieldMappings: {},
    },
  },
  {
    id: 'http-delete',
    type: 'api',
    label: 'HTTP DELETE',
    icon: 'trash',
    description: 'Make a DELETE request to an API endpoint',
    category: 'api',
    handles: DEFAULT_HANDLES.api,
    defaultData: {
      label: 'HTTP DELETE',
      nodeType: 'api',
      executionType: 'action',
      method: 'DELETE',
      url: '',
      headers: [],
      queryParams: [],
      auth: { type: 'none' },
      requestSchema: [],
      responseSchema: [],
      fieldMappings: {},
    },
  },

  // Transform Nodes
  {
    id: 'map',
    type: 'transform',
    label: 'Map Data',
    icon: 'map',
    description: 'Transform and map data fields',
    category: 'transform',
    handles: DEFAULT_HANDLES.transform,
    defaultData: {
      label: 'Map Data',
      nodeType: 'transform',
      executionType: 'transform',
      transformType: 'map',
      mappings: [],
    },
  },
  {
    id: 'filter',
    type: 'transform',
    label: 'Filter',
    icon: 'filter',
    description: 'Filter data based on conditions',
    category: 'transform',
    handles: DEFAULT_HANDLES.transform,
    defaultData: {
      label: 'Filter',
      nodeType: 'transform',
      executionType: 'transform',
      transformType: 'filter',
      expression: '',
    },
  },
  {
    id: 'custom-transform',
    type: 'transform',
    label: 'Custom Transform',
    icon: 'code',
    description: 'Apply custom transformation logic',
    category: 'transform',
    handles: DEFAULT_HANDLES.transform,
    defaultData: {
      label: 'Custom Transform',
      nodeType: 'transform',
      executionType: 'transform',
      transformType: 'custom',
      expression: '// Transform your data here\nreturn input;',
    },
  },

  // Condition Nodes
  {
    id: 'if-else',
    type: 'condition',
    label: 'If/Else',
    icon: 'git-branch',
    description: 'Branch based on a condition',
    category: 'logic',
    handles: DEFAULT_HANDLES.condition,
    defaultData: {
      label: 'If/Else',
      nodeType: 'condition',
      executionType: 'control',
      conditions: [],
    },
  },

  // Logic Nodes
  {
    id: 'string-builder',
    type: 'transform',
    label: 'String Builder',
    icon: 'type',
    description: 'Concatenate strings and build text',
    category: 'logic',
    handles: DEFAULT_HANDLES.transform,
    defaultData: {
      label: 'String Builder',
      nodeType: 'logic',
      executionType: 'transform',
      template: 'Hello {name}!',
      variables: [],
    },
  },
  {
    id: 'greeter',
    type: 'transform',
    label: 'Greeter',
    icon: 'message-circle',
    description: 'Create greeting messages',
    category: 'logic',
    handles: DEFAULT_HANDLES.transform,
    defaultData: {
      label: 'Greeter',
      nodeType: 'logic',
      executionType: 'transform',
      greetingType: 'hello',
      nameField: 'name',
    },
  },

  // UI Component Nodes
  {
    id: 'user-input',
    type: 'input',
    label: 'User Input',
    icon: 'edit-3',
    description: 'Get input from user',
    category: 'ui',
    handles: DEFAULT_HANDLES.input,
    defaultData: {
      label: 'User Input',
      nodeType: 'input',
      executionType: 'manual',
      placeholder: 'Enter value...',
      defaultValue: '',
    },
  },
  {
    id: 'display',
    type: 'output',
    label: 'Display',
    icon: 'monitor',
    description: 'Display data to user',
    category: 'ui',
    handles: DEFAULT_HANDLES.output,
    defaultData: {
      label: 'Display',
      nodeType: 'react',
      executionType: 'output',
      displayType: 'text',
      format: 'plain',
    },
  },

  // Input/Output Nodes
  {
    id: 'workflow-input',
    type: 'input',
    label: 'Workflow Input',
    icon: 'log-in',
    description: 'Starting point for workflow data',
    category: 'io',
    handles: DEFAULT_HANDLES.input,
    defaultData: {
      label: 'Workflow Input',
      nodeType: 'input',
      executionType: 'trigger',
      inputType: 'manual',
    },
  },
  {
    id: 'webhook-trigger',
    type: 'input',
    label: 'Webhook Trigger',
    icon: 'zap',
    description: 'Trigger workflow from a webhook',
    category: 'io',
    handles: DEFAULT_HANDLES.input,
    defaultData: {
      label: 'Webhook Trigger',
      nodeType: 'input',
      executionType: 'trigger',
      inputType: 'webhook',
    },
  },
  {
    id: 'workflow-output',
    type: 'output',
    label: 'Workflow Output',
    icon: 'log-out',
    description: 'Final output of the workflow',
    category: 'io',
    handles: DEFAULT_HANDLES.output,
    defaultData: {
      label: 'Workflow Output',
      nodeType: 'output',
      executionType: 'output',
      outputType: 'response',
      format: 'json',
    },
  },
];

/**
 * Node type to React Flow node type mapping
 */
export const NODE_TYPE_MAP: Record<NodeType, string> = {
  api: 'apiNode',
  transform: 'transformNode',
  condition: 'conditionNode',
  input: 'inputNode',
  output: 'outputNode',
};

/**
 * Node colors by type
 */
export const NODE_COLORS: Record<NodeType, string> = {
  api: '#3b82f6', // blue
  transform: '#8b5cf6', // purple
  condition: '#f59e0b', // amber
  input: '#ec4899', // pink
  output: '#10b981', // emerald
};

/**
 * HTTP Method colors
 */
export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e', // green
  POST: '#3b82f6', // blue
  PUT: '#f59e0b', // amber
  PATCH: '#8b5cf6', // purple
  DELETE: '#ef4444', // red
};
