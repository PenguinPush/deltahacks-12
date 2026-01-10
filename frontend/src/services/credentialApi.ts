// import { get, post, put, del } from './api';
import type {
  Credential,
  CredentialCreateRequest,
  CredentialUpdateRequest,
} from '@/types';

/**
 * Credential API Service
 *
 * Handles all API calls related to stored credentials.
 * Credentials are stored securely on the backend.
 *
 * TODO: Implement actual API endpoints
 * TODO: Add credential validation
 * TODO: Add OAuth2 flow support
 */
export const credentialApi = {
  /**
   * Get list of all credentials (metadata only, no secrets)
   */
  async listCredentials(): Promise<Credential[]> {
    // TODO: Implement actual API call
    // return get<Credential[]>('/credentials');

    // Mock implementation
    return Promise.resolve([
      {
        id: 'cred-1',
        name: 'Stripe API Key',
        type: 'api-key',
        service: 'stripe',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isValid: true,
      },
      {
        id: 'cred-2',
        name: 'SendGrid API Key',
        type: 'api-key',
        service: 'sendgrid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isValid: true,
      },
    ]);
  },

  /**
   * Get a single credential by ID
   */
  async getCredential(id: string): Promise<Credential> {
    // TODO: Implement actual API call
    // return get<Credential>(`/credentials/${id}`);

    return Promise.resolve({
      id,
      name: 'Sample Credential',
      type: 'api-key',
      service: 'sample',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isValid: true,
    });
  },

  /**
   * Create a new credential
   */
  async createCredential(request: CredentialCreateRequest): Promise<Credential> {
    // TODO: Implement actual API call
    // return post<Credential>('/credentials', request);

    return Promise.resolve({
      id: `cred-${Date.now()}`,
      name: request.name,
      type: request.type,
      service: request.service,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isValid: true,
    });
  },

  /**
   * Update a credential
   */
  async updateCredential(id: string, request: CredentialUpdateRequest): Promise<Credential> {
    // TODO: Implement actual API call
    // return put<Credential>(`/credentials/${id}`, request);

    const existing = await this.getCredential(id);
    return {
      ...existing,
      ...request,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete a credential
   */
  async deleteCredential(_id: string): Promise<void> {
    // TODO: Implement actual API call
    // return del(`/credentials/${id}`);

    return Promise.resolve();
  },

  /**
   * Test a credential
   */
  async testCredential(_id: string): Promise<{ valid: boolean; message?: string }> {
    // TODO: Implement actual API call
    // return post<{ valid: boolean; message?: string }>(`/credentials/${id}/test`);

    return Promise.resolve({
      valid: true,
      message: 'Credential is valid',
    });
  },

  /**
   * Get credentials for a specific service
   */
  async getCredentialsForService(service: string): Promise<Credential[]> {
    const all = await this.listCredentials();
    return all.filter((c) => c.service === service);
  },

  /**
   * Initiate OAuth2 flow
   */
  async initiateOAuth2(service: string): Promise<{ authUrl: string }> {
    // TODO: Implement actual OAuth2 flow
    // return post<{ authUrl: string }>('/credentials/oauth2/initiate', { service });

    return Promise.resolve({
      authUrl: `https://example.com/oauth2/authorize?service=${service}`,
    });
  },

  /**
   * Complete OAuth2 flow
   */
  async completeOAuth2(
    service: string,
    _code: string
  ): Promise<Credential> {
    // TODO: Implement actual OAuth2 flow completion
    // return post<Credential>('/credentials/oauth2/complete', { service, code });

    return Promise.resolve({
      id: `cred-oauth-${Date.now()}`,
      name: `${service} OAuth`,
      type: 'oauth2',
      service,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isValid: true,
    });
  },
};

export default credentialApi;
