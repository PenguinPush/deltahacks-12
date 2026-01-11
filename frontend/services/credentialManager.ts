/**
 * Credential Manager
 * Client-side credential storage with simulated encryption
 */

import type { Credential, CredentialData, CredentialType } from '../types/workflow';

const STORAGE_KEY = 'nodelink_credentials';
const ENCRYPTION_KEY = 'nodelink_secret_key'; // In production, use proper key management

// Simple XOR-based obfuscation (NOT real encryption - for demo purposes)
function obfuscate(text: string): string {
  const key = ENCRYPTION_KEY;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function deobfuscate(encoded: string): string {
  const key = ENCRYPTION_KEY;
  const text = atob(encoded);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export interface StoredCredential extends Credential {
  encryptedData: string;
}

class CredentialManager {
  private credentials: Map<string, StoredCredential> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredCredential[];
        parsed.forEach(cred => this.credentials.set(cred.id, cred));
      }
    } catch (e) {
      console.error('Failed to load credentials:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.credentials.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save credentials:', e);
    }
  }

  /**
   * Store a new credential
   */
  store(
    name: string,
    type: CredentialType,
    serviceId: string,
    serviceName: string,
    data: CredentialData
  ): Credential {
    const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const credential: StoredCredential = {
      id,
      name,
      type,
      serviceId,
      serviceName,
      createdAt: now,
      updatedAt: now,
      isValid: true,
      encryptedData: obfuscate(JSON.stringify(data)),
    };

    this.credentials.set(id, credential);
    this.saveToStorage();

    return this.toPublicCredential(credential);
  }

  /**
   * Get credential metadata (without sensitive data)
   */
  get(id: string): Credential | undefined {
    const stored = this.credentials.get(id);
    return stored ? this.toPublicCredential(stored) : undefined;
  }

  /**
   * Get decrypted credential data
   */
  getData(id: string): CredentialData | undefined {
    const stored = this.credentials.get(id);
    if (!stored) return undefined;

    try {
      return JSON.parse(deobfuscate(stored.encryptedData));
    } catch {
      return undefined;
    }
  }

  /**
   * Get all credentials for a service
   */
  getByService(serviceId: string): Credential[] {
    return Array.from(this.credentials.values())
      .filter(c => c.serviceId === serviceId)
      .map(c => this.toPublicCredential(c));
  }

  /**
   * Get all credentials
   */
  getAll(): Credential[] {
    return Array.from(this.credentials.values())
      .map(c => this.toPublicCredential(c));
  }

  /**
   * Update credential
   */
  update(id: string, updates: Partial<{ name: string; data: CredentialData }>): Credential | undefined {
    const stored = this.credentials.get(id);
    if (!stored) return undefined;

    if (updates.name) {
      stored.name = updates.name;
    }
    if (updates.data) {
      stored.encryptedData = obfuscate(JSON.stringify(updates.data));
    }
    stored.updatedAt = Date.now();

    this.saveToStorage();
    return this.toPublicCredential(stored);
  }

  /**
   * Delete credential
   */
  delete(id: string): boolean {
    const deleted = this.credentials.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Validate credential (simulated)
   */
  async validate(id: string): Promise<{ valid: boolean; message: string }> {
    const data = this.getData(id);
    if (!data) {
      return { valid: false, message: 'Credential not found' };
    }

    // Simulate API validation
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Random validation result for demo
    const valid = Math.random() > 0.2;

    const stored = this.credentials.get(id);
    if (stored) {
      stored.isValid = valid;
      stored.lastUsed = Date.now();
      this.saveToStorage();
    }

    return {
      valid,
      message: valid ? 'Credentials are valid' : 'Invalid or expired credentials',
    };
  }

  /**
   * Mark credential as used
   */
  markUsed(id: string): void {
    const stored = this.credentials.get(id);
    if (stored) {
      stored.lastUsed = Date.now();
      this.saveToStorage();
    }
  }

  /**
   * Get masked preview of credential data
   */
  getMaskedPreview(id: string): Record<string, string> {
    const data = this.getData(id);
    if (!data) return {};

    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        if (value.length <= 8) {
          masked[key] = '••••••••';
        } else {
          masked[key] = value.substring(0, 4) + '••••' + value.substring(value.length - 4);
        }
      } else if (value !== undefined) {
        masked[key] = String(value);
      }
    }
    return masked;
  }

  private toPublicCredential(stored: StoredCredential): Credential {
    const { encryptedData: _encryptedData, ...public_ } = stored;
    return public_;
  }
}

export const credentialManager = new CredentialManager();
