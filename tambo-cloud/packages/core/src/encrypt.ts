import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

function splitFromEnd(str: string, delimiter: string): [string, string] {
  const parts = str.split(delimiter);
  const lastPart = parts.pop()!;
  return [parts.join(delimiter), lastPart];
}

const algorithm = "aes-256-cbc";
const IV_LENGTH = 16; // 16 bytes for AES

// Hashing to ensure 32-byte key length for AES-256
function getHashedKey(key: string): Buffer {
  return createHash("sha256").update(key).digest();
}

/** Turn a raw api key into an encrypted string, signed */
export function encryptApiKey(
  storedString: string,
  apiKey: string,
  apiKeySecret: string,
): string {
  const secretKey = getHashedKey(apiKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${storedString}.${apiKey}`;
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}.${encrypted}`;
}

export function decryptApiKey(
  encryptedData: string,
  apiKeySecret: string,
): {
  storedString: string;
  apiKey: string;
} {
  const secretKey = getHashedKey(apiKeySecret);

  const [ivHex, encrypted] = splitFromEnd(encryptedData, ".");

  if (!ivHex || !encrypted) {
    console.error("Invalid encrypted data format in apikey");
    throw new Error("Invalid apikey format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to decrypt API key", {
      cause: error,
    });
  }

  const [storedString, apiKey] = splitFromEnd(decrypted, ".");
  return { storedString, apiKey };
}

export function hashKey(apiKey: string) {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");
  return hashedKey;
}

export function encryptProviderKey(
  providerName: string,
  providerKey: string,
  providerKeySecret: string,
): string {
  const secretKey = getHashedKey(providerKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${providerName}.${providerKey}`;
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}.${encrypted}`;
}

export function decryptProviderKey(
  encryptedData: string,
  providerKeySecret: string,
): {
  providerName: string;
  providerKey: string;
} {
  const secretKey = getHashedKey(providerKeySecret);

  const [ivHex, encrypted] = splitFromEnd(encryptedData, ".");

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to decrypt provider key", {
      cause: error,
    });
  }

  const [providerName, providerKey] = splitFromEnd(decrypted, ".");
  return { providerName, providerKey };
}

export function hideApiKey(apiKey: string, visibleCharacters = 4): string {
  const hiddenPart = apiKey.substring(visibleCharacters).replace(/./g, "*");
  return apiKey.substring(0, visibleCharacters) + hiddenPart;
}
