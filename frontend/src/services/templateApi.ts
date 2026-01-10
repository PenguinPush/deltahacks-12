// import { get, post } from './api';
import type {
  Template,
  TemplateListItem,
  TemplateFilters,
  TemplateCategoryInfo,
} from '@/types';
import { API_CATEGORIES } from '@constants/apiCategories';

/**
 * Template API Service
 *
 * Handles all API calls related to templates.
 *
 * TODO: Implement actual API endpoints
 * TODO: Add template caching
 */
export const templateApi = {
  /**
   * Get list of templates with optional filters
   */
  async listTemplates(filters: TemplateFilters = {}): Promise<TemplateListItem[]> {
    // TODO: Implement actual API call
    // return get<TemplateListItem[]>('/templates', { params: filters });

    // Mock implementation
    const mockTemplates: TemplateListItem[] = [
      {
        id: 'stripe-payment',
        name: 'Stripe Payment Processing',
        description: 'Process payments using Stripe API with webhook handling',
        category: 'payment',
        difficulty: 'intermediate',
        source: 'official',
        icon: '💳',
        downloads: 1250,
        rating: 4.8,
        tags: ['stripe', 'payment', 'checkout'],
      },
      {
        id: 'sendgrid-email',
        name: 'SendGrid Email Sender',
        description: 'Send transactional emails using SendGrid API',
        category: 'email',
        difficulty: 'beginner',
        source: 'official',
        icon: '📧',
        downloads: 890,
        rating: 4.6,
        tags: ['email', 'sendgrid', 'notification'],
      },
      {
        id: 'openai-chat',
        name: 'OpenAI Chat Completion',
        description: 'Generate AI responses using OpenAI GPT models',
        category: 'ai',
        difficulty: 'beginner',
        source: 'official',
        icon: '🤖',
        downloads: 2100,
        rating: 4.9,
        tags: ['ai', 'openai', 'gpt', 'chat'],
      },
      {
        id: 's3-upload',
        name: 'AWS S3 File Upload',
        description: 'Upload files to AWS S3 with pre-signed URLs',
        category: 'storage',
        difficulty: 'intermediate',
        source: 'official',
        icon: '☁️',
        downloads: 750,
        rating: 4.5,
        tags: ['aws', 's3', 'storage', 'upload'],
      },
      {
        id: 'twitter-post',
        name: 'Twitter/X Post Publisher',
        description: 'Publish posts to Twitter/X platform',
        category: 'social',
        difficulty: 'intermediate',
        source: 'community',
        icon: '🐦',
        downloads: 420,
        rating: 4.2,
        tags: ['twitter', 'social', 'post'],
      },
    ];

    // Apply filters
    let result = mockTemplates;

    if (filters.category) {
      result = result.filter((t) => t.category === filters.category);
    }

    if (filters.difficulty) {
      result = result.filter((t) => t.difficulty === filters.difficulty);
    }

    if (filters.source) {
      result = result.filter((t) => t.source === filters.source);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    return Promise.resolve(result);
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    // TODO: Implement actual API call
    // return get<Template>(`/templates/${id}`);

    // Mock implementation
    return Promise.resolve({
      metadata: {
        id,
        name: 'Sample Template',
        description: 'A sample template for demonstration',
        category: 'utility',
        difficulty: 'beginner',
        source: 'official',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloads: 100,
        rating: 4.5,
        tags: ['sample', 'demo'],
      },
      workflow: {
        metadata: {
          id: `workflow-${id}`,
          name: 'Sample Template Workflow',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        nodes: [],
        edges: [],
      },
      credentials: [],
      variables: [],
      documentation: '# Sample Template\n\nThis is a sample template.',
    });
  },

  /**
   * Get template categories
   */
  async getCategories(): Promise<TemplateCategoryInfo[]> {
    // Return static categories from constants
    return Promise.resolve(API_CATEGORIES);
  },

  /**
   * Submit a template for community sharing
   */
  async submitTemplate(_template: Template): Promise<{ id: string }> {
    // TODO: Implement actual API call
    // return post<{ id: string }>('/templates', template);

    return Promise.resolve({
      id: `template-${Date.now()}`,
    });
  },

  /**
   * Rate a template
   */
  async rateTemplate(_id: string, _rating: number): Promise<void> {
    // TODO: Implement actual API call
    // return post(`/templates/${id}/rate`, { rating });

    return Promise.resolve();
  },

  /**
   * Report a template
   */
  async reportTemplate(_id: string, _reason: string): Promise<void> {
    // TODO: Implement actual API call
    // return post(`/templates/${id}/report`, { reason });

    return Promise.resolve();
  },
};

export default templateApi;
