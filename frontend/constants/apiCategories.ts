import type { TemplateCategoryInfo } from '@/types';

/**
 * API/Template Categories
 *
 * Categories for organizing API templates and pre-built integrations
 */
export const API_CATEGORIES: TemplateCategoryInfo[] = [
  {
    id: 'payment',
    label: 'Payment',
    description: 'Payment processing and financial services',
    icon: 'credit-card',
    color: '#22c55e',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Email sending and management services',
    icon: 'mail',
    color: '#3b82f6',
  },
  {
    id: 'storage',
    label: 'Storage',
    description: 'Cloud storage and file management',
    icon: 'hard-drive',
    color: '#8b5cf6',
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Social media platforms and APIs',
    icon: 'users',
    color: '#ec4899',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Analytics and tracking services',
    icon: 'bar-chart',
    color: '#f59e0b',
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Customer relationship management',
    icon: 'briefcase',
    color: '#14b8a6',
  },
  {
    id: 'messaging',
    label: 'Messaging',
    description: 'SMS, chat, and push notifications',
    icon: 'message-circle',
    color: '#6366f1',
  },
  {
    id: 'ai',
    label: 'AI & ML',
    description: 'Artificial intelligence and machine learning',
    icon: 'cpu',
    color: '#a855f7',
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Database and data storage services',
    icon: 'database',
    color: '#f97316',
  },
  {
    id: 'utility',
    label: 'Utility',
    description: 'General utility and helper APIs',
    icon: 'tool',
    color: '#64748b',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Custom and user-created templates',
    icon: 'plus-circle',
    color: '#94a3b8',
  },
];

/**
 * Popular API services by category
 *
 * Used for quick-add templates and suggestions
 */
export const POPULAR_SERVICES: Record<string, string[]> = {
  payment: ['Stripe', 'PayPal', 'Square', 'Braintree'],
  email: ['SendGrid', 'Mailgun', 'AWS SES', 'Postmark'],
  storage: ['AWS S3', 'Google Cloud Storage', 'Dropbox', 'Box'],
  social: ['Twitter/X', 'Facebook', 'LinkedIn', 'Instagram'],
  analytics: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment'],
  crm: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho'],
  messaging: ['Twilio', 'Firebase', 'Pusher', 'OneSignal'],
  ai: ['OpenAI', 'Anthropic', 'Google AI', 'Hugging Face'],
  database: ['MongoDB', 'Firebase', 'Supabase', 'PlanetScale'],
  utility: ['Zapier', 'IFTTT', 'Make', 'n8n'],
};

/**
 * Default timeout values (in milliseconds)
 */
export const API_TIMEOUTS = {
  default: 30000,
  short: 5000,
  medium: 15000,
  long: 60000,
  extended: 120000,
} as const;

/**
 * Rate limit presets
 */
export const RATE_LIMITS = {
  conservative: { requests: 10, window: 60 },
  moderate: { requests: 60, window: 60 },
  aggressive: { requests: 120, window: 60 },
} as const;

/**
 * Common content types
 */
export const CONTENT_TYPES = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
  xml: 'application/xml',
  text: 'text/plain',
  html: 'text/html',
} as const;

/**
 * Common HTTP headers
 */
export const COMMON_HEADERS = [
  { key: 'Content-Type', values: Object.values(CONTENT_TYPES) },
  { key: 'Accept', values: Object.values(CONTENT_TYPES) },
  { key: 'Authorization', values: ['Bearer <token>', 'Basic <credentials>'] },
  { key: 'X-API-Key', values: ['<api-key>'] },
  { key: 'User-Agent', values: ['NodeLink/1.0'] },
  { key: 'Cache-Control', values: ['no-cache', 'max-age=3600'] },
] as const;
