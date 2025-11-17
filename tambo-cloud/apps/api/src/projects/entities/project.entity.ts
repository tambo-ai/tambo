import { APIKey } from "./api-key.entity";
import { ProviderKey } from "./provider-key.entity";

export class Project {
  id!: string;
  name!: string;
  userId!: string;
  isTokenRequired!: boolean;
  apiKeys?: APIKey[];
  providerKeys: ProviderKey[] = [];

  hideApiKey(apiKey: string, visibleCharacters = 4): string {
    // Clamp the repeat count so it is never negative. If the caller requests
    // more visible characters than the key has, we reveal the entire key and
    // add no masking characters.
    const hiddenCount = Math.max(0, apiKey.length - visibleCharacters);
    const hiddenPart = "*".repeat(hiddenCount);
    return apiKey.substring(0, visibleCharacters) + hiddenPart;
  }

  getProviderKeys() {
    return this.providerKeys;
  }
}
