import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import { SchemaFieldList } from '@components/Schema';
import type { SchemaField } from '@/types';
import { useNodeZIndex } from '@/store/nodeZIndex';
import { WORKFLOW_TEMPLATES } from '@/data/templates';
import {
  Home,
  Save,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Settings,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Play,
  Search,
  CreditCard,
  Mail,
  Database,
  FileText,
  Cloud,
  MessageSquare,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  LayoutGrid,
  ChevronUp,
  Wand2,
  RotateCcw,
  FileJson,
  GitBranch,
  Zap,
  LogIn,
  LogOut,
  Map,
  Filter,
  Code,
} from 'lucide-react';

// Import panel components
// (No panels currently used)

// Import workflow validation
import { validateWorkflow } from '../services/workflowValidator';
import type { WorkflowValidation } from '../types/execution.types';

import 'reactflow/dist/style.css';

// ============================================
// TYPES
// ============================================

interface APITemplate {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  category: string;
  description: string;
  usageCount?: number;
  executionType?: 'action'; // API templates are always action nodes
  fields: {
    inputs: FieldDefinition[];
    outputs: FieldDefinition[];
  };
  credentials: CredentialField[];
  parameters: ParameterField[];
  isCustom?: boolean; // Flag for custom API with user-defined schema
}

interface FieldDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
  example?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

interface CredentialField {
  id: string;
  name: string;
  type: 'text' | 'password';
  required: boolean;
  placeholder?: string;
}

interface ParameterField {
  id: string;
  name: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  required: boolean;
  default?: string | number | boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

interface NodeData {
  label: string;
  type: string;
  description: string;
  color: string;
  templateId: string;
  credentials?: Record<string, string>;
  parameters?: Record<string, string | number | boolean>;
  inputValues?: Record<string, string | number | boolean>; // For input field values
  status?: 'idle' | 'running' | 'success' | 'error';
  executionTime?: number;
  result?: unknown;
  error?: string;
  // Custom API schema (for isCustom templates)
  customInputs?: FieldDefinition[];
  customOutputs?: FieldDefinition[];
}

interface ActivityEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  expanded?: boolean;
  details?: string;
}

// Enhanced field mapping with transformations
type TransformationType =
  | 'direct'           // 1:1 mapping
  | 'template'         // String template with placeholders
  | 'format_date'      // Date formatting
  | 'format_currency'  // Currency formatting
  | 'conditional'      // If/else logic
  | 'compose'          // Combine multiple fields
  | 'extract'          // Extract from object/array
  | 'default';         // Default value if null

interface FieldMapping {
  id: string;
  targetField: string;
  transformationType: TransformationType;
  // For direct mapping
  sourceField?: string;
  // For template/compose mapping
  template?: string;
  sourceFields?: string[];
  // For conditional mapping
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'is_null' | 'not_null' | 'contains';
    value?: string;
    thenValue: string;
    elseValue: string;
  };
  // For formatting
  format?: string;
  // For default values
  defaultValue?: string;
  // Validation
  required?: boolean;
  errorMessage?: string;
}

// Pre-built integration recipes
interface IntegrationRecipe {
  id: string;
  name: string;
  description: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  mappings: FieldMapping[];
  notes?: string[];
}

// Integration recipes for common workflows
const integrationRecipes: IntegrationRecipe[] = [
  // Stripe → SendGrid (Payment Confirmation Email)
  {
    id: 'stripe-sendgrid-payment',
    name: 'Payment Confirmation Email',
    description: 'Send email confirmation when Stripe payment succeeds',
    sourceTemplateId: 'stripe',
    targetTemplateId: 'sendgrid',
    mappings: [
      {
        id: 'm1',
        targetField: 'to',
        transformationType: 'direct',
        sourceField: 'customer_email',
        required: true,
        errorMessage: 'Customer email is required for sending confirmation',
      },
      {
        id: 'm2',
        targetField: 'from',
        transformationType: 'default',
        defaultValue: 'noreply@yourcompany.com',
        required: true,
      },
      {
        id: 'm3',
        targetField: 'subject',
        transformationType: 'template',
        template: 'Payment Confirmed - Order #{{payment_id}}',
        sourceFields: ['payment_id'],
        required: true,
      },
      {
        id: 'm4',
        targetField: 'body',
        transformationType: 'compose',
        template: `Thank you for your payment!

Payment Details:
- Payment ID: {{payment_id}}
- Amount: {{amount}} {{currency}}
- Status: {{status}}
- Date: {{created_at}}

{{#if receipt_url}}
View your receipt: {{receipt_url}}
{{/if}}

If you have any questions, please contact our support team.`,
        sourceFields: ['payment_id', 'amount', 'currency', 'status', 'created_at', 'receipt_url'],
      },
      {
        id: 'm5',
        targetField: 'template_id',
        transformationType: 'default',
        defaultValue: 'd-payment-confirmation',
      },
    ],
    notes: [
      'Ensure customer email is captured during Stripe checkout',
      'Configure SendGrid dynamic template for better formatting',
      'Handle failed payments with different email template',
    ],
  },
  // Stripe → Airtable (Payment Record)
  {
    id: 'stripe-airtable-record',
    name: 'Log Payment to Database',
    description: 'Store payment details in Airtable for record-keeping',
    sourceTemplateId: 'stripe',
    targetTemplateId: 'airtable',
    mappings: [
      {
        id: 'm1',
        targetField: 'record_data',
        transformationType: 'compose',
        template: JSON.stringify({
          'Payment ID': '{{payment_id}}',
          'Amount': '{{amount}}',
          'Currency': '{{currency}}',
          'Status': '{{status}}',
          'Receipt URL': '{{receipt_url}}',
          'Created At': '{{created_at}}',
        }),
        sourceFields: ['payment_id', 'amount', 'currency', 'status', 'receipt_url', 'created_at'],
      },
    ],
  },
  // OpenAI → SendGrid (AI-Generated Email)
  {
    id: 'openai-sendgrid-ai-email',
    name: 'AI-Generated Email',
    description: 'Send AI-generated content via email',
    sourceTemplateId: 'openai',
    targetTemplateId: 'sendgrid',
    mappings: [
      {
        id: 'm1',
        targetField: 'body',
        transformationType: 'direct',
        sourceField: 'response',
        required: true,
      },
      {
        id: 'm2',
        targetField: 'subject',
        transformationType: 'template',
        template: 'AI Response - {{model}}',
        sourceFields: ['model'],
      },
    ],
  },
  // Webhook → Twilio (Alert SMS)
  {
    id: 'webhook-twilio-alert',
    name: 'Webhook Alert SMS',
    description: 'Send SMS alert when webhook is triggered',
    sourceTemplateId: 'webhook',
    targetTemplateId: 'twilio',
    mappings: [
      {
        id: 'm1',
        targetField: 'body',
        transformationType: 'template',
        template: 'Alert: Webhook triggered with status {{status_code}}. Check dashboard for details.',
        sourceFields: ['status_code'],
        required: true,
      },
    ],
  },
  // Stripe → Twilio (Payment SMS)
  {
    id: 'stripe-twilio-payment-sms',
    name: 'Payment SMS Notification',
    description: 'Send SMS when payment is received',
    sourceTemplateId: 'stripe',
    targetTemplateId: 'twilio',
    mappings: [
      {
        id: 'm1',
        targetField: 'body',
        transformationType: 'conditional',
        condition: {
          field: 'status',
          operator: 'equals',
          value: 'succeeded',
          thenValue: 'Payment of {{amount}} {{currency}} received! Ref: {{payment_id}}',
          elseValue: 'Payment failed. Please try again or contact support.',
        },
        required: true,
      },
    ],
  },
  // Google Sheets → SendGrid (Batch Email)
  {
    id: 'sheets-sendgrid-batch',
    name: 'Spreadsheet Email Blast',
    description: 'Send emails using data from Google Sheets',
    sourceTemplateId: 'google-sheets',
    targetTemplateId: 'sendgrid',
    mappings: [
      {
        id: 'm1',
        targetField: 'to',
        transformationType: 'extract',
        sourceField: 'values',
        format: 'array[0].email',
        required: true,
      },
      {
        id: 'm2',
        targetField: 'body',
        transformationType: 'template',
        template: 'Hello {{name}}, {{message}}',
        sourceFields: ['values'],
      },
    ],
  },
  // OpenAI → Airtable (Store AI Response)
  {
    id: 'openai-airtable-store',
    name: 'Store AI Response',
    description: 'Save AI-generated content to Airtable',
    sourceTemplateId: 'openai',
    targetTemplateId: 'airtable',
    mappings: [
      {
        id: 'm1',
        targetField: 'record_data',
        transformationType: 'compose',
        template: JSON.stringify({
          'Prompt': '{{prompt}}',
          'Response': '{{response}}',
          'Model': '{{model}}',
          'Tokens Used': '{{usage}}',
          'Generated At': '{{timestamp}}',
        }),
        sourceFields: ['prompt', 'response', 'model', 'usage'],
      },
    ],
  },
  // AWS Lambda → SendGrid (Function Result Email)
  {
    id: 'lambda-sendgrid-result',
    name: 'Lambda Result Email',
    description: 'Email AWS Lambda function results',
    sourceTemplateId: 'aws-lambda',
    targetTemplateId: 'sendgrid',
    mappings: [
      {
        id: 'm1',
        targetField: 'subject',
        transformationType: 'conditional',
        condition: {
          field: 'status_code',
          operator: 'equals',
          value: '200',
          thenValue: 'Lambda Function Completed Successfully',
          elseValue: 'Lambda Function Error - Action Required',
        },
      },
      {
        id: 'm2',
        targetField: 'body',
        transformationType: 'template',
        template: `Lambda Function Execution Report

Status: {{status_code}}
Response: {{response}}

Logs:
{{log_result}}`,
        sourceFields: ['status_code', 'response', 'log_result'],
      },
    ],
  },
];

// ============================================
// API TEMPLATES DATA
// ============================================

const apiTemplates: APITemplate[] = [
  // Basic Workflow Nodes
  {
    id: 'workflow-input',
    name: 'Workflow Input',
    icon: LogIn,
    color: '#EC4899',
    category: 'workflow',
    description: 'Starting point for manual workflow execution',
    executionType: 'action',
    fields: {
      inputs: [],
      outputs: [
        { id: 'data', name: 'Input Data', type: 'object', description: 'Data passed to workflow' },
      ],
    },
    credentials: [],
    parameters: [
      {
        id: 'input_type', name: 'Input Type', type: 'select', required: true, default: 'manual', options: [
          { value: 'manual', label: 'Manual Trigger' },
          { value: 'schedule', label: 'Scheduled' },
        ]
      },
    ],
  },
  {
    id: 'webhook-trigger',
    name: 'Webhook Trigger',
    icon: Zap,
    color: '#EC4899',
    category: 'workflow',
    description: 'Trigger workflow from external HTTP webhook',
    executionType: 'action',
    fields: {
      inputs: [],
      outputs: [
        { id: 'body', name: 'Request Body', type: 'object', description: 'Webhook request body' },
        { id: 'headers', name: 'Headers', type: 'object', description: 'HTTP headers from webhook' },
        { id: 'query', name: 'Query Parameters', type: 'object', description: 'URL query parameters' },
      ],
    },
    credentials: [],
    parameters: [
      { id: 'path', name: 'Webhook Path', type: 'text', required: true, placeholder: '/webhook/my-trigger', default: '/webhook' },
      {
        id: 'method', name: 'HTTP Method', type: 'select', required: true, default: 'POST', options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
        ]
      },
    ],
  },
  {
    id: 'workflow-output',
    name: 'Workflow Output',
    icon: LogOut,
    color: '#10B981',
    category: 'workflow',
    description: 'Final output destination for workflow results',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'data', name: 'Output Data', type: 'object', required: true, description: 'Data to output' },
      ],
      outputs: [],
    },
    credentials: [],
    parameters: [
      {
        id: 'output_type', name: 'Output Type', type: 'select', required: true, default: 'response', options: [
          { value: 'response', label: 'HTTP Response' },
          { value: 'log', label: 'Log Only' },
          { value: 'webhook', label: 'Send to Webhook' },
        ]
      },
      {
        id: 'format', name: 'Format', type: 'select', required: true, default: 'json', options: [
          { value: 'json', label: 'JSON' },
          { value: 'text', label: 'Plain Text' },
        ]
      },
    ],
  },
  {
    id: 'map-data',
    name: 'Map Data',
    icon: Map,
    color: '#8B5CF6',
    category: 'workflow',
    description: 'Transform and map data fields',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'input', name: 'Input Data', type: 'object', required: true, description: 'Data to transform' },
      ],
      outputs: [
        { id: 'output', name: 'Transformed Data', type: 'object', description: 'Mapped output' },
      ],
    },
    credentials: [],
    parameters: [
      {
        id: 'transform_type', name: 'Transform Type', type: 'select', required: true, default: 'map', options: [
          { value: 'map', label: 'Map Fields' },
          { value: 'custom', label: 'Custom JavaScript' },
        ]
      },
    ],
  },
  {
    id: 'filter-data',
    name: 'Filter',
    icon: Filter,
    color: '#8B5CF6',
    category: 'workflow',
    description: 'Filter data based on conditions',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'input', name: 'Input Data', type: 'array', required: true, description: 'Data to filter' },
      ],
      outputs: [
        { id: 'output', name: 'Filtered Data', type: 'array', description: 'Filtered results' },
      ],
    },
    credentials: [],
    parameters: [
      { id: 'expression', name: 'Filter Expression', type: 'text', required: true, placeholder: 'item.status === "active"' },
    ],
  },
  {
    id: 'custom-transform',
    name: 'Custom Transform',
    icon: Code,
    color: '#8B5CF6',
    category: 'workflow',
    description: 'Apply custom JavaScript transformation',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'input', name: 'Input Data', type: 'object', required: true, description: 'Data to transform' },
      ],
      outputs: [
        { id: 'output', name: 'Transformed Data', type: 'object', description: 'Custom output' },
      ],
    },
    credentials: [],
    parameters: [
      { id: 'expression', name: 'JavaScript Code', type: 'text', required: true, placeholder: 'return { ...input, processed: true }' },
    ],
  },
  {
    id: 'if-else',
    name: 'If/Else',
    icon: GitBranch,
    color: '#F59E0B',
    category: 'workflow',
    description: 'Branch workflow based on conditions',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'input', name: 'Input Data', type: 'object', required: true, description: 'Data to evaluate' },
      ],
      outputs: [
        { id: 'true', name: 'True Branch', type: 'object', description: 'Output if condition is true' },
        { id: 'false', name: 'False Branch', type: 'object', description: 'Output if condition is false' },
      ],
    },
    credentials: [],
    parameters: [
      { id: 'condition', name: 'Condition', type: 'text', required: true, placeholder: 'input.value > 100' },
    ],
  },

  // Payment APIs
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    color: '#635BFF',
    category: 'payments',
    description: 'Process payments and manage subscriptions',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'amount', name: 'Amount', type: 'number', required: true, description: 'Payment amount in cents', example: '2500' },
        { id: 'currency', name: 'Currency', type: 'string', required: true, description: 'Three-letter ISO currency code', example: 'usd', validation: { pattern: '^[a-z]{3}$' } },
        { id: 'customer_id', name: 'Customer ID', type: 'string', description: 'Stripe customer identifier', example: 'cus_ABC123' },
        { id: 'customer_email', name: 'Customer Email', type: 'string', description: 'Email for receipt delivery', example: 'customer@email.com' },
        { id: 'description', name: 'Description', type: 'string', description: 'Payment description for records' },
        { id: 'metadata', name: 'Metadata', type: 'object', description: 'Additional key-value data' },
      ],
      outputs: [
        { id: 'payment_id', name: 'Payment ID', type: 'string', description: 'Unique payment identifier', example: 'pi_3ABC123' },
        { id: 'amount', name: 'Amount', type: 'number', description: 'Charged amount in cents' },
        { id: 'currency', name: 'Currency', type: 'string', description: 'Currency code used' },
        { id: 'status', name: 'Status', type: 'string', description: 'Payment status', validation: { enum: ['succeeded', 'pending', 'failed', 'canceled'] } },
        { id: 'receipt_url', name: 'Receipt URL', type: 'string', description: 'Link to payment receipt (may be null)' },
        { id: 'customer_email', name: 'Customer Email', type: 'string', description: 'Customer email from payment' },
        { id: 'created_at', name: 'Created At', type: 'string', description: 'ISO 8601 timestamp', example: '2024-01-15T10:30:00Z' },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'sk_live_...' },
    ],
    parameters: [
      {
        id: 'endpoint', name: 'Endpoint', type: 'select', required: true, default: 'charges', options: [
          { value: 'charges', label: 'Create Charge' },
          { value: 'customers', label: 'Create Customer' },
          { value: 'subscriptions', label: 'Create Subscription' },
          { value: 'payment_intents', label: 'Create Payment Intent' },
        ]
      },
      { id: 'test_mode', name: 'Test Mode', type: 'boolean', required: false, default: true },
    ],
  },
  // Email APIs
  {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: Mail,
    color: '#1A82E2',
    category: 'email',
    description: 'Send transactional and marketing emails',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'to', name: 'To Email', type: 'string', required: true, description: 'Recipient email address', example: 'recipient@email.com' },
        { id: 'from', name: 'From Email', type: 'string', required: true, description: 'Verified sender email', example: 'noreply@yourcompany.com' },
        { id: 'subject', name: 'Subject', type: 'string', required: true, description: 'Email subject line', example: 'Your Order Confirmation' },
        { id: 'body', name: 'Body', type: 'string', required: true, description: 'Email content (HTML or plain text)' },
        { id: 'template_id', name: 'Template ID', type: 'string', description: 'SendGrid dynamic template ID', example: 'd-abc123' },
        { id: 'dynamic_data', name: 'Template Data', type: 'object', description: 'Dynamic substitution variables for template' },
        { id: 'reply_to', name: 'Reply-To', type: 'string', description: 'Reply-to email address' },
        { id: 'attachments', name: 'Attachments', type: 'array', description: 'File attachments array' },
      ],
      outputs: [
        { id: 'message_id', name: 'Message ID', type: 'string', description: 'SendGrid message identifier' },
        { id: 'status', name: 'Status', type: 'string', description: 'Delivery status', validation: { enum: ['accepted', 'rejected', 'failed'] } },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'SG...' },
    ],
    parameters: [
      {
        id: 'content_type', name: 'Content Type', type: 'select', required: true, default: 'text/html', options: [
          { value: 'text/html', label: 'HTML' },
          { value: 'text/plain', label: 'Plain Text' },
        ]
      },
      { id: 'sandbox_mode', name: 'Sandbox Mode', type: 'boolean', required: false, default: false },
    ],
  },
  // Database APIs
  {
    id: 'airtable',
    name: 'Airtable',
    icon: Database,
    color: '#18BFFF',
    category: 'database',
    description: 'Store and retrieve data from Airtable bases',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'base_id', name: 'Base ID', type: 'string', required: true, description: 'Airtable base identifier', example: 'appXXXXXXXXXXXXXX' },
        { id: 'table_name', name: 'Table Name', type: 'string', required: true, description: 'Name of the table to operate on' },
        { id: 'record_data', name: 'Record Data', type: 'object', description: 'JSON object with field names and values' },
        { id: 'record_id', name: 'Record ID', type: 'string', description: 'Record ID for read/update/delete operations', example: 'recXXXXXXXXXXXXXX' },
        { id: 'filter_formula', name: 'Filter Formula', type: 'string', description: 'Airtable formula to filter records', example: "{Status} = 'Active'" },
        { id: 'sort', name: 'Sort', type: 'array', description: 'Array of sort specifications' },
        { id: 'max_records', name: 'Max Records', type: 'number', description: 'Maximum number of records to return' },
      ],
      outputs: [
        { id: 'record_id', name: 'Record ID', type: 'string', description: 'ID of created/updated record' },
        { id: 'fields', name: 'Fields', type: 'object', description: 'Record field values' },
        { id: 'created_time', name: 'Created Time', type: 'string', description: 'ISO 8601 timestamp of record creation' },
        { id: 'records', name: 'Records', type: 'array', description: 'Array of records (for list operation)' },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'key...' },
    ],
    parameters: [
      {
        id: 'action', name: 'Action', type: 'select', required: true, default: 'create', options: [
          { value: 'create', label: 'Create Record' },
          { value: 'read', label: 'Read Record' },
          { value: 'update', label: 'Update Record' },
          { value: 'delete', label: 'Delete Record' },
          { value: 'list', label: 'List Records' },
        ]
      },
    ],
  },
  // AI APIs
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Sparkles,
    color: '#10A37F',
    category: 'ai',
    description: 'Generate text, images, and embeddings with AI',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'prompt', name: 'Prompt', type: 'string', required: true, description: 'The user message or prompt', example: 'Write a professional email...' },
        { id: 'system_prompt', name: 'System Prompt', type: 'string', description: 'System instructions for AI behavior', example: 'You are a helpful assistant.' },
        { id: 'max_tokens', name: 'Max Tokens', type: 'number', description: 'Maximum length of response', validation: { min: 1, max: 4096 } },
        { id: 'context', name: 'Context', type: 'array', description: 'Previous conversation messages' },
        { id: 'functions', name: 'Functions', type: 'array', description: 'Function definitions for function calling' },
      ],
      outputs: [
        { id: 'response', name: 'Response', type: 'string', description: 'AI-generated text response' },
        { id: 'usage', name: 'Token Usage', type: 'object', description: 'Token count breakdown' },
        { id: 'model', name: 'Model Used', type: 'string', description: 'Model that generated response' },
        { id: 'finish_reason', name: 'Finish Reason', type: 'string', description: 'Why generation stopped', validation: { enum: ['stop', 'length', 'function_call'] } },
        { id: 'function_call', name: 'Function Call', type: 'object', description: 'Function call result if applicable' },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
    ],
    parameters: [
      {
        id: 'model', name: 'Model', type: 'select', required: true, default: 'gpt-4', options: [
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ]
      },
      { id: 'temperature', name: 'Temperature', type: 'number', required: false, default: 0.7, placeholder: '0.0 - 2.0' },
    ],
  },
  // Communication APIs
  {
    id: 'twilio',
    name: 'Twilio',
    icon: MessageSquare,
    color: '#F22F46',
    category: 'communication',
    description: 'Send SMS, voice calls, and WhatsApp messages',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'to', name: 'To Number', type: 'string', required: true, description: 'Recipient phone number in E.164 format', example: '+14155551234' },
        { id: 'from', name: 'From Number', type: 'string', required: true, description: 'Twilio phone number to send from', example: '+15551234567' },
        { id: 'body', name: 'Message Body', type: 'string', required: true, description: 'Text content of the message (max 1600 chars)', validation: { max: 1600 } },
        { id: 'media_url', name: 'Media URL', type: 'string', description: 'URL of media to attach (MMS)' },
        { id: 'status_callback', name: 'Status Callback', type: 'string', description: 'URL to receive delivery status updates' },
      ],
      outputs: [
        { id: 'message_sid', name: 'Message SID', type: 'string', description: 'Unique message identifier', example: 'SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
        { id: 'status', name: 'Status', type: 'string', description: 'Message status', validation: { enum: ['queued', 'sent', 'delivered', 'failed', 'undelivered'] } },
        { id: 'price', name: 'Price', type: 'string', description: 'Message cost' },
        { id: 'error_code', name: 'Error Code', type: 'number', description: 'Error code if failed' },
        { id: 'error_message', name: 'Error Message', type: 'string', description: 'Error description if failed' },
      ],
    },
    credentials: [
      { id: 'account_sid', name: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
      { id: 'auth_token', name: 'Auth Token', type: 'password', required: true },
    ],
    parameters: [
      {
        id: 'channel', name: 'Channel', type: 'select', required: true, default: 'sms', options: [
          { value: 'sms', label: 'SMS' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'voice', label: 'Voice Call' },
        ]
      },
    ],
  },
  // Webhook/HTTP
  {
    id: 'webhook',
    name: 'Webhook',
    icon: Globe,
    color: '#6366F1',
    category: 'integration',
    description: 'Send HTTP requests to any endpoint',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'url', name: 'URL', type: 'string', required: true, description: 'Full URL including protocol', example: 'https://api.example.com/webhook' },
        { id: 'headers', name: 'Headers', type: 'object', description: 'Custom HTTP headers as key-value pairs' },
        { id: 'body', name: 'Body', type: 'object', description: 'Request body (JSON object)' },
        { id: 'query_params', name: 'Query Parameters', type: 'object', description: 'URL query parameters' },
        { id: 'auth', name: 'Authorization', type: 'object', description: 'Auth config (bearer, basic, api_key)' },
        { id: 'timeout', name: 'Timeout', type: 'number', description: 'Request timeout in milliseconds', validation: { min: 1000, max: 30000 } },
      ],
      outputs: [
        { id: 'status_code', name: 'Status Code', type: 'number', description: 'HTTP response status code', example: '200' },
        { id: 'response_body', name: 'Response Body', type: 'object', description: 'Parsed JSON response' },
        { id: 'headers', name: 'Response Headers', type: 'object', description: 'Response headers' },
        { id: 'response_time', name: 'Response Time', type: 'number', description: 'Request duration in ms' },
        { id: 'success', name: 'Success', type: 'boolean', description: 'True if status 2xx' },
      ],
    },
    credentials: [],
    parameters: [
      {
        id: 'method', name: 'Method', type: 'select', required: true, default: 'POST', options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ]
      },
      {
        id: 'content_type', name: 'Content Type', type: 'select', required: true, default: 'application/json', options: [
          { value: 'application/json', label: 'JSON' },
          { value: 'application/x-www-form-urlencoded', label: 'Form URL Encoded' },
          { value: 'multipart/form-data', label: 'Multipart Form' },
        ]
      },
      { id: 'retry_on_fail', name: 'Retry on Failure', type: 'boolean', required: false, default: false },
    ],
  },
  // Storage
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    icon: FileText,
    color: '#0F9D58',
    category: 'database',
    description: 'Read and write data to Google Sheets',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'spreadsheet_id', name: 'Spreadsheet ID', type: 'string', required: true, description: 'ID from spreadsheet URL', example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
        { id: 'sheet_name', name: 'Sheet Name', type: 'string', required: true, description: 'Name of the sheet tab', example: 'Sheet1' },
        { id: 'range', name: 'Range', type: 'string', description: 'A1 notation range', example: 'A1:D10' },
        { id: 'values', name: 'Values', type: 'array', description: '2D array of values to write' },
        { id: 'row_data', name: 'Row Data', type: 'object', description: 'Object with column headers as keys' },
      ],
      outputs: [
        { id: 'updated_range', name: 'Updated Range', type: 'string', description: 'Range that was modified' },
        { id: 'updated_rows', name: 'Updated Rows', type: 'number', description: 'Number of rows affected' },
        { id: 'updated_columns', name: 'Updated Columns', type: 'number', description: 'Number of columns affected' },
        { id: 'values', name: 'Values', type: 'array', description: '2D array of cell values' },
        { id: 'row_count', name: 'Row Count', type: 'number', description: 'Total rows in result' },
      ],
    },
    credentials: [
      { id: 'service_account', name: 'Service Account JSON', type: 'password', required: true },
    ],
    parameters: [
      {
        id: 'action', name: 'Action', type: 'select', required: true, default: 'append', options: [
          { value: 'read', label: 'Read Range' },
          { value: 'append', label: 'Append Row' },
          { value: 'update', label: 'Update Range' },
          { value: 'clear', label: 'Clear Range' },
          { value: 'batch_update', label: 'Batch Update' },
        ]
      },
      {
        id: 'value_input_option', name: 'Value Input', type: 'select', required: false, default: 'USER_ENTERED', options: [
          { value: 'RAW', label: 'Raw (as-is)' },
          { value: 'USER_ENTERED', label: 'User Entered (parse formulas)' },
        ]
      },
    ],
  },
  // Cloud Functions
  {
    id: 'aws-lambda',
    name: 'AWS Lambda',
    icon: Cloud,
    color: '#FF9900',
    category: 'compute',
    description: 'Invoke AWS Lambda functions',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'function_name', name: 'Function Name', type: 'string', required: true, description: 'Lambda function name or ARN', example: 'my-function' },
        { id: 'payload', name: 'Payload', type: 'object', description: 'JSON payload to pass to function' },
        { id: 'qualifier', name: 'Qualifier', type: 'string', description: 'Version or alias to invoke', example: '$LATEST' },
        { id: 'client_context', name: 'Client Context', type: 'object', description: 'Client-specific context data' },
      ],
      outputs: [
        { id: 'status_code', name: 'Status Code', type: 'number', description: 'HTTP status of invocation' },
        { id: 'response', name: 'Response', type: 'object', description: 'Function return value' },
        { id: 'log_result', name: 'Log Result', type: 'string', description: 'Base64-encoded last 4KB of logs' },
        { id: 'function_error', name: 'Function Error', type: 'string', description: 'Error type if function failed' },
        { id: 'executed_version', name: 'Executed Version', type: 'string', description: 'Version that was executed' },
      ],
    },
    credentials: [
      { id: 'access_key', name: 'Access Key ID', type: 'text', required: true },
      { id: 'secret_key', name: 'Secret Access Key', type: 'password', required: true },
      { id: 'region', name: 'Region', type: 'text', required: true, placeholder: 'us-east-1' },
    ],
    parameters: [
      {
        id: 'invocation_type', name: 'Invocation Type', type: 'select', required: true, default: 'RequestResponse', options: [
          { value: 'RequestResponse', label: 'Synchronous' },
          { value: 'Event', label: 'Asynchronous' },
        ]
      },
    ],
  },
  // MongoDB Atlas
  {
    id: 'mongodb-atlas',
    name: 'MongoDB Atlas',
    icon: Database,
    color: '#00ED64',
    category: 'database',
    description: 'Store workflow results, query data, and log executions with MongoDB Atlas Data API',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'data_source', name: 'Data Source', type: 'string', required: true, description: 'Cluster name from Atlas', example: 'Cluster0' },
        { id: 'database', name: 'Database', type: 'string', required: true, description: 'Database name', example: 'workflows' },
        { id: 'collection', name: 'Collection', type: 'string', required: true, description: 'Collection name', example: 'executions' },
        { id: 'filter', name: 'Filter', type: 'object', description: 'Query filter (for find/update/delete)', example: '{"status": "completed"}' },
        { id: 'document', name: 'Document', type: 'object', description: 'Document to insert/update', example: '{"result": "success", "timestamp": "2024-01-15"}' },
        { id: 'update', name: 'Update', type: 'object', description: 'Update operations ($set, $inc, etc.)', example: '{"$set": {"status": "completed"}}' },
        { id: 'projection', name: 'Projection', type: 'object', description: 'Fields to include/exclude', example: '{"_id": 0, "name": 1}' },
        { id: 'sort', name: 'Sort', type: 'object', description: 'Sort order', example: '{"createdAt": -1}' },
        { id: 'limit', name: 'Limit', type: 'number', description: 'Maximum documents to return', validation: { min: 1, max: 50000 } },
      ],
      outputs: [
        { id: 'documents', name: 'Documents', type: 'array', description: 'Retrieved documents array' },
        { id: 'inserted_id', name: 'Inserted ID', type: 'string', description: 'ID of inserted document' },
        { id: 'matched_count', name: 'Matched Count', type: 'number', description: 'Number of documents matched' },
        { id: 'modified_count', name: 'Modified Count', type: 'number', description: 'Number of documents modified' },
        { id: 'deleted_count', name: 'Deleted Count', type: 'number', description: 'Number of documents deleted' },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'Your Atlas Data API key' },
      { id: 'app_id', name: 'App ID', type: 'text', required: true, placeholder: 'data-xxxxx' },
    ],
    parameters: [
      {
        id: 'action', name: 'Action', type: 'select', required: true, default: 'insertOne', options: [
          { value: 'findOne', label: 'Find One Document' },
          { value: 'find', label: 'Find Multiple Documents' },
          { value: 'insertOne', label: 'Insert One Document' },
          { value: 'insertMany', label: 'Insert Multiple Documents' },
          { value: 'updateOne', label: 'Update One Document' },
          { value: 'updateMany', label: 'Update Multiple Documents' },
          { value: 'deleteOne', label: 'Delete One Document' },
          { value: 'deleteMany', label: 'Delete Multiple Documents' },
          { value: 'aggregate', label: 'Aggregate Pipeline' },
        ]
      },
    ],
  },
  // Moorcheh.ai
  {
    id: 'moorcheh',
    name: 'Moorcheh.ai',
    icon: Sparkles,
    color: '#9333EA',
    category: 'ai',
    description: 'Semantic search and RAG capabilities for AI-powered workflows',
    executionType: 'action',
    fields: {
      inputs: [
        { id: 'query', name: 'Query', type: 'string', required: true, description: 'Search query or question', example: 'What are the payment integration options?' },
        { id: 'collection_id', name: 'Collection ID', type: 'string', required: true, description: 'Moorcheh collection identifier', example: 'col_abc123' },
        { id: 'top_k', name: 'Top K Results', type: 'number', description: 'Number of results to return', validation: { min: 1, max: 100 }, example: '5' },
        { id: 'filter', name: 'Metadata Filter', type: 'object', description: 'Filter results by metadata', example: '{"category": "payments"}' },
        { id: 'context', name: 'Context', type: 'string', description: 'Additional context for RAG generation' },
        { id: 'generate_answer', name: 'Generate Answer', type: 'boolean', description: 'Generate AI answer from results', example: 'true' },
        { id: 'model', name: 'Model', type: 'string', description: 'AI model to use for generation', example: 'gpt-4' },
      ],
      outputs: [
        { id: 'results', name: 'Search Results', type: 'array', description: 'Semantic search results with scores' },
        { id: 'answer', name: 'Generated Answer', type: 'string', description: 'AI-generated answer based on retrieved context' },
        { id: 'sources', name: 'Sources', type: 'array', description: 'Source documents used for answer' },
        { id: 'relevance_scores', name: 'Relevance Scores', type: 'array', description: 'Semantic similarity scores' },
        { id: 'metadata', name: 'Metadata', type: 'object', description: 'Additional result metadata' },
      ],
    },
    credentials: [
      { id: 'api_key', name: 'API Key', type: 'password', required: true, placeholder: 'Your Moorcheh API key' },
    ],
    parameters: [
      {
        id: 'operation', name: 'Operation', type: 'select', required: true, default: 'search', options: [
          { value: 'search', label: 'Semantic Search' },
          { value: 'rag', label: 'RAG (Retrieval + Generation)' },
          { value: 'embed', label: 'Generate Embeddings' },
          { value: 'index', label: 'Index Documents' },
        ]
      },
      { id: 'rerank', name: 'Re-rank Results', type: 'boolean', required: false, default: false },
    ],
  },
  // Custom API - User defines their own schema
  {
    id: 'custom-api',
    name: 'Custom API',
    icon: FileJson,
    color: '#8B5CF6',
    category: 'integration',
    description: 'Connect to any REST API with custom schema',
    executionType: 'action',
    isCustom: true,
    fields: {
      inputs: [], // User will define these
      outputs: [], // User will define these
    },
    credentials: [],
    parameters: [
      {
        id: 'method', name: 'Method', type: 'select', required: true, default: 'GET', options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' },
        ]
      },
      { id: 'url', name: 'Endpoint URL', type: 'text', required: true, placeholder: 'https://api.example.com/endpoint' },
      {
        id: 'content_type', name: 'Content Type', type: 'select', required: true, default: 'application/json', options: [
          { value: 'application/json', label: 'JSON' },
          { value: 'application/x-www-form-urlencoded', label: 'Form URL Encoded' },
          { value: 'multipart/form-data', label: 'Multipart Form' },
        ]
      },
    ],
  },
];

const categories = [
  { id: 'all', name: 'All', icon: LayoutGrid },
  { id: 'workflow', name: 'Workflow', icon: GitBranch },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'database', name: 'Database', icon: Database },
  { id: 'ai', name: 'AI & ML', icon: Sparkles },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'integration', name: 'Integration', icon: Globe },
  { id: 'compute', name: 'Compute', icon: Cloud },
];

// ============================================
// HELPER FUNCTION TO GET TEMPLATE
// ============================================

function getTemplateById(templateId: string): APITemplate | undefined {
  return apiTemplates.find(t => t.id === templateId);
}

// ============================================
// CUSTOM NODE COMPONENT
// ============================================

function APINode({ data, selected, id }: { data: NodeData; selected: boolean; id: string }) {
  const { setNodes } = useReactFlow();
  const [collapsed, setCollapsed] = useState(false);

  // Zustand store for z-index management
  const nodeZIndices = useNodeZIndex((state) => state.nodeZIndices);
  const bringToFront = useNodeZIndex((state) => state.bringToFront);
  const zIndex = nodeZIndices[id] || 1;

  // Look up the icon from the templates array
  const template = getTemplateById(data.templateId);
  const IconComponent = template?.icon || Globe;

  // Initialize parameters if they don't exist
  if (!data.parameters) {
    data.parameters = {};
  }
  if (!data.credentials) {
    data.credentials = {};
  }
  if (!data.inputValues) {
    data.inputValues = {};
  }

  // Update node data when parameter changes
  const updateNodeData = (key: string, value: any, type: 'parameter' | 'credential' | 'input') => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data };
          if (type === 'parameter') {
            newData.parameters = { ...newData.parameters, [key]: value };
          } else if (type === 'credential') {
            newData.credentials = { ...newData.credentials, [key]: value };
          } else if (type === 'input') {
            newData.inputValues = { ...newData.inputValues, [key]: value };
          }
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  // Bring node to front when clicked or dragged
  const handleMouseDown = () => {
    bringToFront(id);
  };

  // Determine border color based on status and selection
  const getBorderStyle = () => {
    if (data.status === 'error') {
      return '3px solid #EF4444'; // Red for errors
    }
    if (data.status === 'running') {
      return '3px solid #22C55E'; // Green for running
    }
    if (selected) {
      return '3px solid rgba(59, 130, 246, 0.6)'; // Bright blue for selected
    }
    return '1px solid rgba(255, 255, 255, 0.1)'; // Default subtle border
  };

  // Animation class for running and error states
  const getAnimationClass = () => {
    if (data.status === 'running') return 'animate-pulse';
    if (data.status === 'error') return 'animate-shake';
    return '';
  };

  return (
    <div
      className={`workflow-node ${getAnimationClass()}`}
      onMouseDown={handleMouseDown}
      style={{
        minWidth: 280,
        maxWidth: 350,
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        backdropFilter: 'blur(6px)',
        border: getBorderStyle(),
        boxShadow: selected ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
        zIndex: zIndex,
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-gray-500 !bg-gray-700 hover:!border-accent-blue hover:!bg-accent-blue transition-all !-left-1"
      />

      {/* Header */}
      <div
        className="workflow-node-header cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
        style={{
          backgroundColor: `${data.color}20`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${data.color}40` }}
        >
          {data.status === 'running' ? (
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: data.color }} />
          ) : data.status === 'success' ? (
            <CheckCircle className="w-3 h-3 text-status-success" />
          ) : data.status === 'error' ? (
            <AlertCircle className="w-3 h-3 text-status-error" />
          ) : (
            <IconComponent className="w-3 h-3" style={{ color: data.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{data.label}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
        />
      </div>

      {/* Body - Blender-style parameters */}
      {!collapsed && (
        <div className="p-2 space-y-2">
          {/* Input Fields */}
          {template?.fields?.inputs && template.fields.inputs.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Inputs</div>
              {template.fields.inputs.slice(0, 3).map((field) => (
                <div key={field.id} className="space-y-0.5">
                  <label className="text-[11px] text-gray-300 px-1 flex items-center gap-1">
                    {field.name}
                    {field.required && <span className="text-status-error">*</span>}
                  </label>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 px-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(data.inputValues?.[field.id])}
                        onChange={(e) => updateNodeData(field.id, e.target.checked, 'input')}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-accent-blue focus:ring-1 focus:ring-accent-blue"
                      />
                      <span className="text-[10px] text-gray-400">Enable</span>
                    </label>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String(data.inputValues?.[field.id] || '')}
                      onChange={(e) => updateNodeData(field.id, e.target.value, 'input')}
                      placeholder={field.example || field.description}
                      className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue nodrag"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Credentials */}
          {template?.credentials && template.credentials.length > 0 && (
            <div className="space-y-1.5 border-t border-gray-700 pt-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Credentials</div>
              {template.credentials.map((cred) => (
                <div key={cred.id} className="space-y-0.5">
                  <label className="text-[11px] text-gray-300 px-1 flex items-center gap-1">
                    {cred.name}
                    {cred.required && <span className="text-status-error">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={cred.type}
                      value={data.credentials?.[cred.id] || ''}
                      onChange={(e) => updateNodeData(cred.id, e.target.value, 'credential')}
                      placeholder={cred.placeholder || `Enter ${cred.name.toLowerCase()}`}
                      className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue nodrag"
                    />
                    {cred.type === 'password' && (
                      <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Parameters */}
          {template?.parameters && template.parameters.length > 0 && (
            <div className="space-y-1.5 border-t border-gray-700 pt-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Parameters</div>
              {template.parameters.map((param) => (
                <div key={param.id} className="space-y-0.5">
                  <label className="text-[11px] text-gray-300 px-1 flex items-center gap-1">
                    {param.name}
                    {param.required && <span className="text-status-error">*</span>}
                  </label>
                  {param.type === 'select' && param.options ? (
                    <select
                      value={String(data.parameters?.[param.id] || param.default || '')}
                      onChange={(e) => updateNodeData(param.id, e.target.value, 'parameter')}
                      disabled={param.disabled}
                      className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-accent-blue nodrag disabled:opacity-50"
                    >
                      {param.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : param.type === 'boolean' ? (
                    <label className="flex items-center gap-2 px-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(data.parameters?.[param.id] !== undefined ? data.parameters[param.id] : param.default)}
                        onChange={(e) => updateNodeData(param.id, e.target.checked, 'parameter')}
                        className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-accent-blue focus:ring-1 focus:ring-accent-blue"
                      />
                      <span className="text-[10px] text-gray-400">Enable</span>
                    </label>
                  ) : (
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      value={String(data.parameters?.[param.id] !== undefined ? data.parameters[param.id] : param.default || '')}
                      onChange={(e) => updateNodeData(param.id, param.type === 'number' ? parseFloat(e.target.value) : e.target.value, 'parameter')}
                      placeholder={param.placeholder}
                      className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue nodrag"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Status indicators */}
          {data.executionTime !== undefined && (
            <div className="text-[10px] text-gray-500 px-1 pt-1 border-t border-gray-700">
              ⚡ {data.executionTime}ms
            </div>
          )}

          {data.error && (
            <div className="text-[10px] text-status-error px-1 py-1 bg-red-900/20 rounded border border-red-900/40">
              ⚠️ {data.error}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-gray-500 !bg-gray-700 hover:!border-accent-blue hover:!bg-accent-blue transition-all !-right-1"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  api: APINode,
};

// ============================================
// NODE CONFIGURATION MODAL
// ============================================

function NodeConfigModal({
  node,
  template,
  onClose,
  onSave,
}: {
  node: Node<NodeData>;
  template: APITemplate | undefined;
  onClose: () => void;
  onSave: (
    credentials: Record<string, string>,
    parameters: Record<string, string | number | boolean>,
    customInputs?: SchemaField[],
    customOutputs?: SchemaField[]
  ) => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>(node.data.credentials || {});
  const [parameters, setParameters] = useState<Record<string, string | number | boolean>>(node.data.parameters || {});
  // Convert FieldDefinition[] to SchemaField[] for the schema editor
  const [customInputs, setCustomInputs] = useState<SchemaField[]>(
    node.data.customInputs?.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      description: f.description,
    })) || []
  );
  const [customOutputs, setCustomOutputs] = useState<SchemaField[]>(
    node.data.customOutputs?.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      description: f.description,
    })) || []
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (template) {
      const defaultParams: Record<string, string | number | boolean> = {};
      template.parameters.forEach(p => {
        if (p.default !== undefined && parameters[p.id] === undefined) {
          defaultParams[p.id] = p.default;
        }
      });
      if (Object.keys(defaultParams).length > 0) {
        setParameters(prev => ({ ...defaultParams, ...prev }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.3;
    setTestResult({
      success,
      message: success
        ? 'Connection successful! API credentials are valid.'
        : 'Connection failed. Please check your credentials.',
    });
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(credentials, parameters, customInputs, customOutputs);
    onClose();
  };

  if (!template) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: template.color }}
            >
              <template.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="modal-title">Configure {template.name}</h2>
              <p className="text-small text-text-tertiary">{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Credentials Section */}
          {template.credentials.length > 0 && (
            <div>
              <h3 className="text-label text-text-primary mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-text-tertiary" />
                Credentials
              </h3>
              <div className="space-y-4 bg-app-bg rounded-lg p-4">
                {template.credentials.map(cred => (
                  <div key={cred.id}>
                    <label className="form-label">
                      {cred.name} {cred.required && <span className="text-status-error">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={cred.type === 'password' && !showPasswords[cred.id] ? 'password' : 'text'}
                        value={credentials[cred.id] || ''}
                        onChange={e => setCredentials(prev => ({ ...prev, [cred.id]: e.target.value }))}
                        placeholder={cred.placeholder}
                        className="form-input pr-10"
                      />
                      {cred.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon p-1"
                        >
                          {showPasswords[cred.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameters Section */}
          {template.parameters.length > 0 && (
            <div>
              <h3 className="text-label text-text-primary mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-text-tertiary" />
                Parameters
              </h3>
              <div className="space-y-4">
                {template.parameters.map(param => (
                  <div key={param.id}>
                    <label className="form-label">
                      {param.name} {param.required && <span className="text-status-error">*</span>}
                    </label>
                    {param.type === 'select' ? (
                      <select
                        value={String(parameters[param.id] || param.default || '')}
                        onChange={e => setParameters(prev => ({ ...prev, [param.id]: e.target.value }))}
                        className="form-select"
                      >
                        {param.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : param.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(parameters[param.id] ?? param.default)}
                          onChange={e => setParameters(prev => ({ ...prev, [param.id]: e.target.checked }))}
                          className="w-4 h-4 accent-accent-blue"
                        />
                        <span className="text-body text-text-secondary">Enabled</span>
                      </label>
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={String(parameters[param.id] || '')}
                        onChange={e => setParameters(prev => ({
                          ...prev,
                          [param.id]: param.type === 'number' ? Number(e.target.value) : e.target.value
                        }))}
                        placeholder={param.placeholder}
                        className="form-input"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input/Output Fields - Editable for Custom API, Preview for others */}
          {template.isCustom ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-label text-text-primary mb-3">Input Schema</h3>
                <SchemaFieldList
                  fields={customInputs}
                  onChange={setCustomInputs}
                  title=""
                  description="Define the fields this API expects as input"
                />
              </div>
              <div>
                <h3 className="text-label text-text-primary mb-3">Output Schema</h3>
                <SchemaFieldList
                  fields={customOutputs}
                  onChange={setCustomOutputs}
                  title=""
                  description="Define the fields this API returns (available to downstream nodes)"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-label text-text-primary mb-3">Inputs</h3>
                <div className="bg-[#1b1b1b] rounded-sm border-white p-3 space-y-2">
                  {template.fields.inputs.map(field => (
                    <div key={field.id} className="flex items-center justify-between text-small">
                      <span className="text-text-secondary">{field.name}</span>
                      <span className="text-text-tertiary">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-label text-text-primary mb-3">Outputs</h3>
                <div className="bg-[#1b1b1b] rounded-sm p-3 space-y-2">
                  {template.fields.outputs.map(field => (
                    <div key={field.id} className="flex items-center justify-between text-small">
                      <span className="text-text-secondary">{field.name}</span>
                      <span className="text-text-tertiary">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-sm ${testResult.success ? 'bg-status-success/10 border border-status-success/30' : 'bg-status-error/10 border border-status-error/30'}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-status-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-status-error" />
                )}
                <p className={`text-body ${testResult.success ? 'text-status-success' : 'text-status-error'}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {/* Only show Test Connection for nodes with credentials */}
          {template.credentials.length > 0 && (
            <button onClick={handleTest} disabled={isTesting} className="btn-secondary">
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FIELD MAPPER MODAL
// ============================================

// Helper to get transformation type label
function getTransformationLabel(type: TransformationType): string {
  const labels: Record<TransformationType, string> = {
    direct: 'Direct',
    template: 'Template',
    format_date: 'Format Date',
    format_currency: 'Format Currency',
    conditional: 'Conditional',
    compose: 'Compose',
    extract: 'Extract',
    default: 'Default Value',
  };
  return labels[type];
}

// Helper to get transformation color
function getTransformationColor(type: TransformationType): string {
  const colors: Record<TransformationType, string> = {
    direct: '#22C55E',
    template: '#3B82F6',
    format_date: '#8B5CF6',
    format_currency: '#F59E0B',
    conditional: '#EC4899',
    compose: '#6366F1',
    extract: '#14B8A6',
    default: '#6B7280',
  };
  return colors[type];
}

function FieldMapperModal({
  sourceNode,
  targetNode,
  sourceTemplate,
  targetTemplate,
  existingMappings,
  onClose,
  onSave,
}: {
  sourceNode: Node<NodeData>;
  targetNode: Node<NodeData>;
  sourceTemplate: APITemplate | undefined;
  targetTemplate: APITemplate | undefined;
  existingMappings: FieldMapping[];
  onClose: () => void;
  onSave: (mappings: FieldMapping[]) => void;
}) {
  const [mappings, setMappings] = useState<FieldMapping[]>(existingMappings);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(true);

  if (!sourceTemplate || !targetTemplate) return null;

  // Find applicable recipes for this source→target combination
  const applicableRecipes = integrationRecipes.filter(
    r => r.sourceTemplateId === sourceTemplate.id && r.targetTemplateId === targetTemplate.id
  );

  // Apply a recipe
  const applyRecipe = (recipe: IntegrationRecipe) => {
    setMappings(recipe.mappings);
    setShowRecipes(false);
  };

  // Simple auto-map based on field name/type matching
  const handleAutoMap = () => {
    const autoMappings: FieldMapping[] = [];

    sourceTemplate.fields.outputs.forEach(output => {
      const match = targetTemplate.fields.inputs.find(input =>
        input.name.toLowerCase() === output.name.toLowerCase() ||
        input.id.toLowerCase() === output.id.toLowerCase() ||
        (input.type === output.type && !autoMappings.find(m => m.targetField === input.id))
      );

      if (match && !autoMappings.find(m => m.targetField === match.id)) {
        autoMappings.push({
          id: `m-${Date.now()}-${output.id}`,
          targetField: match.id,
          transformationType: 'direct',
          sourceField: output.id,
        });
      }
    });

    setMappings(autoMappings);
  };

  // Add a new direct mapping via drag-drop
  const handleFieldDrop = (targetField: string) => {
    if (draggingField) {
      setMappings(prev => {
        const filtered = prev.filter(m => m.targetField !== targetField);
        return [...filtered, {
          id: `m-${Date.now()}`,
          targetField,
          transformationType: 'direct' as TransformationType,
          sourceField: draggingField,
        }];
      });
      setDraggingField(null);
    }
  };

  // Remove a mapping
  const removeMapping = (targetField: string) => {
    setMappings(prev => prev.filter(m => m.targetField !== targetField));
    setSelectedMapping(null);
  };

  // Get the mapping for a target field
  const getMapping = (targetField: string) => {
    return mappings.find(m => m.targetField === targetField);
  };

  // Update a mapping's transformation type
  const updateMappingType = (targetField: string, type: TransformationType) => {
    setMappings(prev => prev.map(m =>
      m.targetField === targetField ? { ...m, transformationType: type } : m
    ));
  };

  // Update a mapping's template
  const updateMappingTemplate = (targetField: string, template: string) => {
    setMappings(prev => prev.map(m =>
      m.targetField === targetField ? { ...m, template } : m
    ));
  };

  // Get display info for a mapping
  const getMappingDisplay = (mapping: FieldMapping) => {
    switch (mapping.transformationType) {
      case 'direct': {
        const sourceField = sourceTemplate.fields.outputs.find(f => f.id === mapping.sourceField);
        return sourceField?.name || mapping.sourceField;
      }
      case 'template':
      case 'compose':
        return mapping.template?.substring(0, 30) + (mapping.template && mapping.template.length > 30 ? '...' : '');
      case 'conditional':
        return `If ${mapping.condition?.field} ${mapping.condition?.operator}...`;
      case 'default':
        return `"${mapping.defaultValue}"`;
      default:
        return mapping.transformationType;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Field Mapping</h2>
            <p className="text-small text-text-tertiary">
              Configure how data flows from {sourceNode.data.label} to {targetNode.data.label}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body max-h-[70vh] overflow-y-auto">
          {/* Helper Text - Explain the interaction */}
          <div className="mb-4 p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-blue mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Drag from a {sourceNode.data.label} output</span> to a <span className="font-medium text-text-primary">{targetNode.data.label} input</span> to connect them. Click a mapped field to configure transformations.
              </p>
            </div>
          </div>

          {/* Integration Recipes Section */}
          {applicableRecipes.length > 0 && showRecipes && (
            <div className="mb-6 p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-blue" />
                  <h3 className="text-label text-text-primary">Recommended Integrations</h3>
                </div>
                <button
                  onClick={() => setShowRecipes(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-2">
                {applicableRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-3 bg-app-bg rounded-lg border border-border hover:border-accent-blue cursor-pointer transition-all"
                    onClick={() => applyRecipe(recipe)}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{recipe.name}</p>
                      <p className="text-xs text-text-tertiary">{recipe.description}</p>
                    </div>
                    <button className="btn-secondary text-xs px-3 py-1">
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              {applicableRecipes[0]?.notes && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <p className="text-xs text-text-tertiary flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {applicableRecipes[0].notes[0]}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {applicableRecipes.length > 0 && !showRecipes && (
                <button
                  onClick={() => setShowRecipes(true)}
                  className="btn-secondary text-small"
                >
                  <Sparkles className="w-4 h-4" />
                  Show Recipes
                </button>
              )}
            </div>
            <button onClick={handleAutoMap} className="btn-secondary text-small">
              <Wand2 className="w-4 h-4" />
              Auto-Map Fields
            </button>
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
            {/* Source outputs */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: sourceNode.data.color }}
                >
                  {sourceTemplate && <sourceTemplate.icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <h3 className="text-label text-text-primary">{sourceNode.data.label} Outputs</h3>
              </div>
              <div className="bg-app-bg rounded-lg p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {sourceTemplate.fields.outputs.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary text-sm">
                    No output fields available
                  </div>
                ) : (
                  sourceTemplate.fields.outputs.map(field => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => setDraggingField(field.id)}
                      onDragEnd={() => setDraggingField(null)}
                      className={`relative p-2 pr-8 rounded-md cursor-grab border transition-all group ${draggingField === field.id
                        ? 'border-accent-blue bg-accent-blue/10 shadow-lg'
                        : 'border-border hover:border-accent-blue/50 hover:bg-accent-blue/5'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-small text-text-primary font-medium">{field.name}</span>
                        <span className="text-tiny text-text-tertiary px-1.5 py-0.5 bg-app-component rounded">
                          {field.type}
                        </span>
                      </div>
                      {field.description && (
                        <p className="text-xs text-text-tertiary mt-1">{field.description}</p>
                      )}
                      {field.example && (
                        <p className="text-xs text-text-tertiary mt-0.5 font-mono">e.g., {field.example}</p>
                      )}
                      {/* Connection handle */}
                      <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all ${draggingField === field.id
                        ? 'border-accent-blue bg-accent-blue scale-125'
                        : 'border-border bg-app-bg group-hover:border-accent-blue group-hover:scale-110'
                        }`} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Connection visual indicator */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className={`transition-all ${draggingField ? 'animate-pulse' : ''}`}>
                <ArrowRight className={`w-6 h-6 transition-colors ${draggingField ? 'text-accent-blue' : 'text-text-tertiary'
                  }`} />
              </div>
              {draggingField && (
                <p className="text-xs text-accent-blue font-medium mt-2 text-center">
                  Dragging...
                </p>
              )}
            </div>

            {/* Target inputs */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: targetNode.data.color }}
                >
                  {targetTemplate && <targetTemplate.icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <h3 className="text-label text-text-primary">{targetNode.data.label} Inputs</h3>
              </div>
              <div className="bg-app-bg rounded-lg p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {targetTemplate.fields.inputs.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary text-sm">
                    No input fields available
                  </div>
                ) : (
                  targetTemplate.fields.inputs.map(field => {
                    const mapping = getMapping(field.id);
                    const isSelected = selectedMapping === field.id;
                    const isDragTarget = draggingField !== null;
                    return (
                      <div key={field.id}>
                        <div
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleFieldDrop(field.id)}
                          onClick={() => setSelectedMapping(isSelected ? null : field.id)}
                          className={`relative p-2 pl-8 rounded-md border transition-all cursor-pointer group ${mapping
                            ? 'border-status-success/50 bg-status-success/5 hover:border-status-success'
                            : isDragTarget
                              ? 'border-accent-blue border-dashed bg-accent-blue/10 animate-pulse'
                              : 'border-border hover:border-accent-blue/50 hover:bg-accent-blue/5'
                            } ${isSelected ? 'ring-2 ring-accent-blue/50' : ''}`}
                        >
                          {/* Connection handle - left side for drop target */}
                          <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all ${mapping
                            ? 'border-status-success bg-status-success'
                            : isDragTarget
                              ? 'border-accent-blue bg-accent-blue/20 scale-125 animate-pulse'
                              : 'border-border bg-app-bg group-hover:border-accent-blue group-hover:scale-110'
                            }`} />

                          <div className="flex items-center justify-between">
                            <span className="text-small text-text-primary font-medium">
                              {field.name}
                              {field.required && <span className="text-status-error ml-1">*</span>}
                            </span>
                            <span className="text-tiny text-text-tertiary px-1.5 py-0.5 bg-app-component rounded">
                              {field.type}
                            </span>
                          </div>
                          {field.description && (
                            <p className="text-xs text-text-tertiary mt-1">{field.description}</p>
                          )}
                          {mapping && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-tiny px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${getTransformationColor(mapping.transformationType)}20`,
                                    color: getTransformationColor(mapping.transformationType),
                                  }}
                                >
                                  {getTransformationLabel(mapping.transformationType)}
                                </span>
                                <span className="text-xs text-text-secondary truncate max-w-[120px]">
                                  {getMappingDisplay(mapping)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeMapping(field.id); }}
                                className="text-text-tertiary hover:text-status-error"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {!mapping && isDragTarget && (
                            <div className="mt-2 text-xs text-accent-blue font-medium">
                              Drop here to connect
                            </div>
                          )}
                        </div>

                        {/* Expanded mapping editor */}
                        {isSelected && mapping && (
                          <div className="mt-2 p-3 bg-app-component rounded-lg border border-border-subtle">
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-text-tertiary block mb-1">Transformation Type</label>
                                <select
                                  value={mapping.transformationType}
                                  onChange={(e) => updateMappingType(field.id, e.target.value as TransformationType)}
                                  className="form-select text-sm"
                                >
                                  <option value="direct">Direct (1:1 mapping)</option>
                                  <option value="template">Template (with placeholders)</option>
                                  <option value="compose">Compose (multiple fields)</option>
                                  <option value="conditional">Conditional (if/else)</option>
                                  <option value="default">Default Value</option>
                                  <option value="format_date">Format Date</option>
                                  <option value="format_currency">Format Currency</option>
                                </select>
                              </div>

                              {mapping.transformationType === 'direct' && (
                                <div>
                                  <label className="text-xs text-text-tertiary block mb-1">Source Field</label>
                                  <select
                                    value={mapping.sourceField || ''}
                                    onChange={(e) => setMappings(prev => prev.map(m =>
                                      m.targetField === field.id ? { ...m, sourceField: e.target.value } : m
                                    ))}
                                    className="form-select text-sm"
                                  >
                                    <option value="">Select field...</option>
                                    {sourceTemplate.fields.outputs.map(f => (
                                      <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {(mapping.transformationType === 'template' || mapping.transformationType === 'compose') && (
                                <div>
                                  <label className="text-xs text-text-tertiary block mb-1">
                                    Template (use {'{{field_name}}'} for variables)
                                  </label>
                                  <textarea
                                    value={mapping.template || ''}
                                    onChange={(e) => updateMappingTemplate(field.id, e.target.value)}
                                    placeholder="e.g., Payment {{payment_id}} for {{amount}} {{currency}}"
                                    className="form-input text-sm font-mono h-20"
                                  />
                                  <p className="text-xs text-text-tertiary mt-1">
                                    Available: {sourceTemplate.fields.outputs.map(f => `{{${f.id}}}`).join(', ')}
                                  </p>
                                </div>
                              )}

                              {mapping.transformationType === 'default' && (
                                <div>
                                  <label className="text-xs text-text-tertiary block mb-1">Default Value</label>
                                  <input
                                    type="text"
                                    value={mapping.defaultValue || ''}
                                    onChange={(e) => setMappings(prev => prev.map(m =>
                                      m.targetField === field.id ? { ...m, defaultValue: e.target.value } : m
                                    ))}
                                    placeholder="Enter default value..."
                                    className="form-input text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Validation summary or empty state */}
          {mappings.length > 0 ? (
            <div className="mt-4 p-3 bg-app-bg rounded-lg border border-border">
              <h4 className="text-xs font-medium text-text-tertiary uppercase mb-2">Mapping Summary</h4>
              <div className="flex flex-wrap gap-2">
                {mappings.map(m => {
                  const targetField = targetTemplate.fields.inputs.find(f => f.id === m.targetField);
                  return (
                    <span
                      key={m.id}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getTransformationColor(m.transformationType)}15`,
                        color: getTransformationColor(m.transformationType),
                        border: `1px solid ${getTransformationColor(m.transformationType)}30`,
                      }}
                    >
                      {targetField?.name}: {getTransformationLabel(m.transformationType)}
                    </span>
                  );
                })}
              </div>
              {/* Check for unmapped required fields */}
              {targetTemplate.fields.inputs.filter(f => f.required && !mappings.find(m => m.targetField === f.id)).length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-status-warning">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Required fields not mapped: {targetTemplate.fields.inputs.filter(f => f.required && !mappings.find(m => m.targetField === f.id)).map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 p-6 bg-app-bg rounded-lg border border-border-subtle text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-text-tertiary/10 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="text-sm text-text-primary font-medium">No mappings configured</p>
                <p className="text-xs text-text-tertiary max-w-md">
                  Drag an output field from the left to an input field on the right to create a connection, or use Auto-Map to automatically connect matching fields.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave(mappings); onClose(); }} className="btn-primary">
            Save Mappings ({mappings.length} fields)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// API TEMPLATE PALETTE
// ============================================

function TemplatePalette({
  isOpen,
  onToggle,
  onDragStart,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onDragStart: (event: React.DragEvent, template: APITemplate) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = apiTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) {
    return (
      <div className="w-12 bg-app-panel border-r border-border flex flex-col items-center py-4">
        <button onClick={onToggle} className="btn-icon mb-4" title="Expand panel">
          <ChevronRight className="w-5 h-5" />
        </button>
        {categories.slice(0, 6).map(cat => {
          const IconComponent = cat.icon;
          return (
            <button key={cat.id} className="btn-icon mb-2" title={cat.name}>
              <IconComponent className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-[300px] bg-app-panel border-r border-border flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">API Templates</span>
        <button onClick={onToggle} className="btn-icon p-1">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border-subtle">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search APIs..."
            className="form-input pl-9 py-2 text-small"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-border-subtle">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 rounded text-tiny font-medium transition-colors ${selectedCategory === cat.id
              ? 'bg-accent-blue text-white'
              : 'bg-app-component text-text-secondary hover:text-text-primary'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTemplates.map(template => {
          const IconComponent = template.icon;
          return (
            <div
              key={template.id}
              draggable
              onDragStart={e => onDragStart(e, template)}
              className="p-3 rounded-lg border border-border hover:border-border-hover bg-app-bg hover:bg-app-component cursor-grab transition-all group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: template.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label text-text-primary">{template.name}</p>
                  <p className="text-tiny text-text-tertiary line-clamp-2 mt-0.5">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// TOOLBAR
// ============================================

function Toolbar({
  projectName,
  onSave,
  onHome,
  onTestWorkflow,
  onAutoLayout,
  onReset,
  isSaved,
  isExecuting,
  nodeCount,
  edgeCount,
}: {
  projectName: string;
  onSave: () => void;
  onHome: () => void;
  onTestWorkflow: () => void;
  onAutoLayout: () => void;
  onReset: () => void;
  isSaved: boolean;
  isExecuting: boolean;
  nodeCount: number;
  edgeCount: number;
}) {
  return (
    <div className="h-[60px] bg-app-panel border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button onClick={onHome} className="btn-icon" title="Home">
          <Home className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-border mx-2" />
        <button onClick={onSave} className="btn-secondary text-small" title="Save (Cmd+S)">
          <Save className="w-4 h-4" />
          Save
          {isSaved && <CheckCircle className="w-3.5 h-3.5 text-status-success" />}
        </button>
        <button onClick={onAutoLayout} className="btn-secondary text-small" title="Auto Layout">
          <LayoutGrid className="w-4 h-4" />
          Layout
        </button>
        <button onClick={onReset} className="btn-secondary text-small" title="Reset View">
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-label text-text-primary">{projectName}</span>
        <span className="text-small text-text-tertiary">
          {nodeCount} nodes &bull; {edgeCount} edges
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTestWorkflow}
          disabled={isExecuting || nodeCount === 0}
          className="btn-primary"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Test Workflow
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXECUTION LOG PANEL
// ============================================

function ExecutionPanel({
  activities,
  isCollapsed,
  onToggleCollapse,
}: {
  activities: ActivityEntry[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const getIcon = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-status-warning" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-status-error" />;
      default: return <Info className="w-4 h-4 text-status-info" />;
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-10 bg-app-panel border-t border-border flex items-center px-4">
        <button onClick={onToggleCollapse} className="flex items-center gap-2 text-small text-text-secondary hover:text-text-primary">
          <Activity className="w-4 h-4" />
          Execution Log
          <ChevronUp className="w-4 h-4" />
        </button>
        {activities.length > 0 && (
          <span className="ml-2 text-tiny text-text-tertiary">{activities.length} entries</span>
        )}
      </div>
    );
  }

  return (
    <div className="h-[200px] bg-app-panel border-t border-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <button onClick={onToggleCollapse} className="flex items-center gap-2 text-small text-text-secondary hover:text-text-primary">
          <Activity className="w-4 h-4" />
          Execution Log
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-small text-text-tertiary">
            Run your workflow to see execution logs
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="activity-entry">
              <div className="activity-icon">{getIcon(activity.type)}</div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                {activity.details && (
                  <pre className="mt-1 text-tiny text-text-tertiary bg-app-bg p-2 rounded overflow-x-auto">
                    {activity.details}
                  </pre>
                )}
                <p className="activity-time flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

function EditorContent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(true);

  // Modal states
  const [configModalNode, setConfigModalNode] = useState<Node<NodeData> | null>(null);
  const [fieldMapperData, setFieldMapperData] = useState<{
    sourceNode: Node<NodeData>;
    targetNode: Node<NodeData>;
    connection: Connection;
  } | null>(null);

  // Workflow states
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  // Workflow validation
  const [validation, setValidation] = useState<WorkflowValidation>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // Activity log
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  const projectName = searchParams.get('name') || 'Untitled Project';

  // Load template on mount if template param exists
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && WORKFLOW_TEMPLATES[templateId]) {
      const template = WORKFLOW_TEMPLATES[templateId];
      setNodes(template.nodes);
      setEdges(template.edges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Get template by ID
  const getTemplate = (templateId: string) => apiTemplates.find(t => t.id === templateId);

  // Add activity
  const addActivity = useCallback((type: ActivityEntry['type'], message: string, details?: string) => {
    setActivities(prev => [{
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      details,
    }, ...prev]);
  }, []);

  // Handle drag start
  const onDragStart = useCallback((event: React.DragEvent, template: APITemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const data = event.dataTransfer.getData('application/reactflow');
    if (!data || !reactFlowBounds) return;

    const template: APITemplate = JSON.parse(data);
    const position = {
      x: event.clientX - reactFlowBounds.left - 110,
      y: event.clientY - reactFlowBounds.top - 40,
    };

    const newNode: Node<NodeData> = {
      id: `node-${Date.now()}`,
      type: 'api',
      position,
      data: {
        label: template.name,
        type: template.name,
        description: template.description,
        color: template.color,
        templateId: template.id,
        status: 'idle',
      },
    };

    setNodes(nds => [...nds, newNode]);
    setIsSaved(false);
    addActivity('success', `Added ${template.name} node`);
  }, [setNodes, addActivity]);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node double click - open config modal
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setConfigModalNode(node);
  }, []);

  // Handle connection - show field mapper
  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (sourceNode && targetNode) {
      setFieldMapperData({ sourceNode, targetNode, connection: params });
    }
  }, [nodes]);

  // Save field mappings and create edge
  const handleSaveFieldMappings = useCallback((mappings: FieldMapping[]) => {
    if (fieldMapperData) {
      const newEdge = {
        ...fieldMapperData.connection,
        id: `edge-${Date.now()}`,
        data: { mappings },
        style: { strokeWidth: 2, stroke: '#22C55E' },
      };
      setEdges(eds => addEdge(newEdge, eds));
      setIsSaved(false);
      addActivity('info', `Connected ${fieldMapperData.sourceNode.data.label} → ${fieldMapperData.targetNode.data.label}`);
    }
    setFieldMapperData(null);
  }, [fieldMapperData, setEdges, addActivity]);

  // Update node configuration
  const handleSaveNodeConfig = useCallback((
    credentials: Record<string, string>,
    parameters: Record<string, string | number | boolean>,
    customInputs?: SchemaField[],
    customOutputs?: SchemaField[]
  ) => {
    if (configModalNode) {
      // Convert SchemaField[] to FieldDefinition[] for storage
      const customInputsFields: FieldDefinition[] | undefined = customInputs?.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.description,
      }));
      const customOutputsFields: FieldDefinition[] | undefined = customOutputs?.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.description,
      }));

      setNodes(nds => nds.map(n =>
        n.id === configModalNode.id
          ? {
            ...n,
            data: {
              ...n.data,
              credentials,
              parameters,
              ...(customInputsFields && { customInputs: customInputsFields }),
              ...(customOutputsFields && { customOutputs: customOutputsFields }),
            }
          }
          : n
      ));
      setIsSaved(false);
      addActivity('success', `Configured ${configModalNode.data.label}`);
    }
  }, [configModalNode, setNodes, addActivity]);

  // Test workflow execution
  const handleTestWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsExecuting(true);
    setLogPanelCollapsed(false);
    addActivity('info', 'Starting workflow execution...');

    // Reset all nodes to idle
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', executionTime: undefined, error: undefined } })));

    // Simulate sequential execution
    for (const node of nodes) {
      // Set node to running
      setNodes(nds => nds.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
      ));
      addActivity('info', `Executing ${node.data.label}...`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      const executionTime = Math.floor(200 + Math.random() * 800);
      const success = Math.random() > 0.15;

      if (success) {
        setNodes(nds => nds.map(n =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'success', executionTime } } : n
        ));
        addActivity('success', `${node.data.label} completed in ${executionTime}ms`);
      } else {
        setNodes(nds => nds.map(n =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'error', executionTime, error: 'API request failed' } } : n
        ));
        addActivity('error', `${node.data.label} failed: API request failed`, 'Check your credentials and try again.');
        break;
      }
    }

    setIsExecuting(false);
    addActivity('info', 'Workflow execution completed');
  }, [nodes, setNodes, addActivity]);

  // Auto layout
  const handleAutoLayout = useCallback(() => {
    const spacing = { x: 300, y: 150 };
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * spacing.x + 100,
        y: Math.floor(index / 3) * spacing.y + 100,
      },
    }));
    setNodes(layoutedNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
    addActivity('info', 'Applied auto-layout');
  }, [nodes, setNodes, fitView, addActivity]);

  // Reset view (fit all nodes into view)
  const handleReset = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    addActivity('info', 'Reset view');
  }, [fitView, addActivity]);

  // Save workflow
  const handleSave = useCallback(() => {
    const workflow = { nodes, edges, metadata: { name: projectName, savedAt: new Date().toISOString() } };
    localStorage.setItem(`workflow-${id || 'new'}`, JSON.stringify(workflow));
    setIsSaved(true);
    addActivity('success', 'Workflow saved');
  }, [nodes, edges, projectName, id, addActivity]);

  // Go home
  const handleHome = useCallback(() => {
    if (!isSaved && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    navigate('/');
  }, [navigate, isSaved]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Load on mount
  useEffect(() => {
    if (id && id !== 'new') {
      const saved = localStorage.getItem(`workflow-${id}`);
      if (saved) {
        const workflow = JSON.parse(saved);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setIsSaved(true);
      }
    }
  }, [id, setNodes, setEdges]);

  // Validate workflow whenever nodes or edges change
  useEffect(() => {
    if (nodes.length === 0) {
      setValidation({ isValid: true, errors: [], warnings: [] });
      return;
    }

    // Transform React Flow types to validator types
    const validationResult = validateWorkflow({
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'api',
        data: n.data as unknown as { [key: string]: unknown; nodeType?: string }
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined
      }))
    });
    setValidation(validationResult);

    // Log validation errors/warnings to activity panel
    if (validationResult.errors.length > 0) {
      addActivity('error', `Workflow validation failed: ${validationResult.errors.length} error(s) found`);
    } else if (validationResult.warnings.length > 0) {
      addActivity('info', `Workflow has ${validationResult.warnings.length} warning(s)`);
    }
  }, [nodes, edges, addActivity]);

  return (
    <div className="h-screen w-screen flex flex-col bg-app-bg overflow-hidden">
      <Toolbar
        projectName={projectName}
        onSave={handleSave}
        onHome={handleHome}
        onTestWorkflow={handleTestWorkflow}
        onAutoLayout={handleAutoLayout}
        onReset={handleReset}
        isSaved={isSaved}
        isExecuting={isExecuting}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      <div className="flex-1 flex overflow-hidden">
        <TemplatePalette
          isOpen={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
          onDragStart={onDragStart}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              nodesDraggable
              nodesConnectable
              elementsSelectable
              selectNodesOnDrag={false}
              defaultEdgeOptions={{
                type: 'default',
                style: { strokeWidth: 2, stroke: '#6B7280' },
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: '#6B7280',
                },
              }}
              connectionLineStyle={{ strokeWidth: 2, stroke: '#3B82F6' }}
              style={{ backgroundColor: '#0D0D0D' }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="#6B7280"
              />
              <Controls className="!bg-app-panel !border-border !rounded-lg !shadow-dropdown" />
              <MiniMap
                nodeColor={node => (node.data as NodeData).color || '#4A4A4A'}
                maskColor="rgba(10, 10, 10, 0.8)"
                style={{ backgroundColor: '#1A1A1A' }}
              />
            </ReactFlow>

            {/* Validation Status Bar */}
            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-app-panel border border-border rounded-lg shadow-dropdown">
                {validation.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-status-error">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {validation.errors.length > 0 && validation.warnings.length > 0 && (
                  <div className="w-px h-4 bg-border" />
                )}
                {validation.warnings.length > 0 && (
                  <div className="flex items-center gap-2 text-status-warning">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setLogPanelCollapsed(false)}
                  className="ml-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          <ExecutionPanel
            activities={activities}
            isCollapsed={logPanelCollapsed}
            onToggleCollapse={() => setLogPanelCollapsed(!logPanelCollapsed)}
          />
        </div>
      </div>

      {/* Node Configuration Modal */}
      {configModalNode && (
        <NodeConfigModal
          node={configModalNode}
          template={getTemplate(configModalNode.data.templateId)}
          onClose={() => setConfigModalNode(null)}
          onSave={handleSaveNodeConfig}
        />
      )}

      {/* Field Mapper Modal */}
      {fieldMapperData && (
        <FieldMapperModal
          sourceNode={fieldMapperData.sourceNode}
          targetNode={fieldMapperData.targetNode}
          sourceTemplate={getTemplate(fieldMapperData.sourceNode.data.templateId)}
          targetTemplate={getTemplate(fieldMapperData.targetNode.data.templateId)}
          existingMappings={[]}
          onClose={() => setFieldMapperData(null)}
          onSave={handleSaveFieldMappings}
        />
      )}
    </div>
  );
}

// ============================================
// EXPORTED COMPONENT
// ============================================

export function Editor() {
  return (
    <ReactFlowProvider>
      <EditorContent />
    </ReactFlowProvider>
  );
}

export default Editor;
