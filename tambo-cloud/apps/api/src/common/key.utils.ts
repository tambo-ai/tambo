import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { ConfigServiceSingleton } from 'src/config.service';

const algorithm = 'aes-256-cbc';
const IV_LENGTH = 16; // 16 bytes for AES

// Hashing to ensure 32-byte key length for AES-256
function getHashedKey(key: string): Buffer {
  return createHash('sha256').update(key).digest();
}

export function encryptApiKey(storedString: string, apiKey: string): string {
  const apiKeySecret =
    ConfigServiceSingleton.getInstance().get<string>('API_KEY_SECRET');
  if (!apiKeySecret) {
    throw new Error('API_KEY_SECRET is not configured');
  }
  const secretKey = getHashedKey(apiKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${storedString}.${apiKey}`;
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}.${encrypted}`;
}

export function decryptApiKey(encryptedData: string): {
  storedString: string;
  apiKey: string;
} {
  const apiKeySecret =
    ConfigServiceSingleton.getInstance().get<string>('API_KEY_SECRET');
  if (!apiKeySecret) {
    throw new Error('API_KEY_SECRET is not configured');
  }
  const secretKey = getHashedKey(apiKeySecret);

  const [ivHex, encrypted] = encryptedData.split('.');

  if (!ivHex || !encrypted) {
    console.error('Invalid encrypted data format in apikey');
    throw new Error('Invalid apikey format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
  } catch (error) {
    console.error(error);
    throw new Error('Failed to decrypt API key');
  }

  const [storedString, apiKey] = decrypted.split('.');
  return { storedString, apiKey };
}

export function hashKey(apiKey: string) {
  const hashedKey = createHash('sha256').update(apiKey).digest('hex');
  return hashedKey;
}

export function encryptProviderKey(
  providerName: string,
  providerKey: string,
): string {
  const providerKeySecret = ConfigServiceSingleton.getInstance().get<string>(
    'PROVIDER_KEY_SECRET',
  );
  if (!providerKeySecret) {
    throw new Error('PROVIDER_KEY_SECRET is not configured');
  }
  const secretKey = getHashedKey(providerKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${providerName}.${providerKey}`;
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}.${encrypted}`;
}

export function decryptProviderKey(encryptedData: string): {
  providerName: string;
  providerKey: string;
} {
  const providerKeySecret = ConfigServiceSingleton.getInstance().get<string>(
    'PROVIDER_KEY_SECRET',
  );
  if (!providerKeySecret) {
    throw new Error('PROVIDER_KEY_SECRET is not configured');
  }
  const secretKey = getHashedKey(providerKeySecret);

  const [ivHex, encrypted] = encryptedData.split('.');

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
  } catch (error) {
    console.error(error);
    throw new Error('Failed to decrypt provider key');
  }

  const [providerName, providerKey] = decrypted.split('.');
  return { providerName, providerKey };
}
