import { v4 as uuidv4 } from 'uuid';
import { APIKey } from './api-key.entity';
import { ProviderKey } from './provider-key.entity';

export class Project {
  id?: string;
  name?: string;
  userId?: string;
  apiKeys?: APIKey[];
  providerKeys: ProviderKey[] = [];

  addApiKey(
    name: string,
    apiKeyFull: string,
    apiKeyHash: string,
    creatorId: string,
  ) {
    if (!this.apiKeys) {
      this.apiKeys = [];
    }
    const apiKey: APIKey = {
      id: uuidv4(),
      name: name,
      hashedKey: apiKeyHash,
      partiallyHiddenKey: this.hideApiKey(apiKeyFull),
      lastUsed: new Date(),
      created: new Date(),
      createdByUserId: creatorId,
    };
    this.apiKeys.push(apiKey);
  }

  getApiKeys() {
    return this.apiKeys ?? [];
  }

  hideApiKey(apiKey: string, visibleCharacters = 4): string {
    const hiddenPart = apiKey.substring(visibleCharacters).replace(/./g, '*');
    return apiKey.substring(0, visibleCharacters) + hiddenPart;
  }

  addProviderKey(
    providerName: string,
    providerKeyEncrypted: string,
    originalKey: string,
  ) {
    const providerKey: ProviderKey = {
      id: uuidv4(),
      providerName: providerName,
      providerKeyEncrypted: providerKeyEncrypted,
      partiallyHiddenKey: this.hideApiKey(originalKey, 10),
    };
    this.providerKeys.push(providerKey);
  }

  removeProviderKey(providerKeyId: string) {
    this.providerKeys = this.providerKeys.filter(
      (key) => key.id !== providerKeyId,
    );
  }

  getProviderKeys() {
    return this.providerKeys;
  }
}
