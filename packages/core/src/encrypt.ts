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

export function extractProviderNameAndKey(decrypted: string): {
  providerName: string;
  providerKey: string;
} {
  // Split on first '.' to handle providerKeys that contain '.'
  const firstDotIndex = decrypted.indexOf(".");
  if (firstDotIndex === -1) {
    // Backward compatibility: old format without delimiter would have returned
    // empty providerName and entire string as providerKey
    return { providerName: "", providerKey: decrypted };
  }

  const providerName = decrypted.substring(0, firstDotIndex);
  const providerKey = decrypted.substring(firstDotIndex + 1);
  return { providerName, providerKey };
}

const algorithm = "aes-256-cbc";
const IV_LENGTH = 16; // 16 bytes for AES
/** Prefix for user-facing API keys – intentionally NOT exported. */
const TAMBO_PREFIX = "tambo_";

/** Strict Base64 check (standard "+/=" alphabet, length multiple of 4, no whitespace). */
const BASE64_REGEX =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// Hashing to ensure 32-byte key length for AES-256
function getHashedKey(key: string): Buffer {
  return createHash("sha256").update(key).digest();
}

/**
 * Encrypt an internal "stored string" and the raw, plaintext API key into a
 * single tambo-prefixed value that can safely be returned to end-users.
 *
 * The resulting format is:
 *   tambo_⟨base64( IV ⧺ cipherText )⟩
 *
 * 1.  A random 16-byte IV is generated (AES-256-CBC requirement).
 * 2.  The `storedString` and `apiKey` are concatenated with "." to keep them
 *     easily separable after decryption.
 * 3.  AES-256-CBC encryption is performed with a key derived from
 *     `apiKeySecret` (SHA-256 hash → 32 bytes).
 * 4.  IV and cipher text are concatenated, converted to Base64 and prefixed
 *     with `tambo_` so the application can recognise the modern encoding.
 *
 * @param storedString – Arbitrary internal identifier that needs to be
 *                       preserved alongside the API key.
 * @param apiKey       – The plaintext API key provided by the user.
 * @param apiKeySecret – Server-side secret used to derive the AES key; **must
 *                       be  kept secure**.
 *
 * @returns Encoded string safe for storage or display (starts with `tambo_`).
 */
export function encryptApiKey(
  storedString: string,
  apiKey: string,
  apiKeySecret: string,
): string {
  const secretKey = getHashedKey(apiKeySecret);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${storedString}.${apiKey}`;

  let encryptedHex = cipher.update(data, "utf8", "hex");
  encryptedHex += cipher.final("hex");

  // turn hex → raw bytes, concat IV + cipher-text, base64-encode
  const encryptedBuf = Buffer.from(encryptedHex, "hex");
  const combined = Buffer.concat([iv, encryptedBuf]);

  return `${TAMBO_PREFIX}${combined.toString("base64")}`;
}

export function decryptApiKey(
  encryptedData: string,
  apiKeySecret: string,
): { storedString: string; apiKey: string } {
  let rawEncrypted: string;

  // ------------------------------------------------------------------
  // 1.  Decode modern  "tambo_<base64( IV ⧺ cipherText )>" wrapper.
  // ------------------------------------------------------------------
  if (encryptedData.startsWith(TAMBO_PREFIX)) {
    const base64Part = encryptedData.slice(TAMBO_PREFIX.length);
    // Reject anything that is not valid, padding–correct Base64.
    if (!BASE64_REGEX.test(base64Part)) {
      throw new Error("Invalid Base64 in API key");
    }
    let decoded: Buffer;
    try {
      decoded = Buffer.from(base64Part, "base64");
    } catch {
      throw new Error("Invalid Base64 in API key");
    }

    if (decoded.length <= IV_LENGTH) {
      throw new Error("Invalid API key – payload too short");
    }

    const ivBuf = decoded.subarray(0, IV_LENGTH);
    const cipherBuf = decoded.subarray(IV_LENGTH);

    rawEncrypted = `${ivBuf.toString("hex")}.${cipherBuf.toString("hex")}`;
  } else {
    // ----------------------------------------------------------------
    // 2.  Raw legacy "<ivHex>.<cipherHex>" format.
    // ----------------------------------------------------------------
    rawEncrypted = encryptedData;
  }

  // ------------------------------------------------------------------
  // Decrypt common "<ivHex>.<cipherHex>" form
  // ------------------------------------------------------------------
  const [ivHex, encryptedHex] = splitFromEnd(rawEncrypted, ".");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted API key format");
  }

  const secretKey = getHashedKey(apiKeySecret);
  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

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

  return extractProviderNameAndKey(decrypted);
}

export function hideApiKey(apiKey: string, visibleCharacters = 4): string {
  // Ensure we never call .repeat() with a negative value
  const hiddenCount = Math.max(0, apiKey.length - visibleCharacters);
  const hiddenPart = "*".repeat(hiddenCount);
  return apiKey.substring(0, visibleCharacters) + hiddenPart;
}

/**
 * Encrypt OAuth secret key using the same encryption as provider keys
 */
export function encryptOAuthSecretKey(
  secretKey: string,
  apiKeySecret: string,
): string {
  return encryptProviderKey("oauth", secretKey, apiKeySecret);
}

/**
 * Decrypt OAuth secret key using the same decryption as provider keys
 */
export function decryptOAuthSecretKey(
  encryptedSecretKey: string,
  apiKeySecret: string,
): string {
  const { providerName, providerKey } = decryptProviderKey(
    encryptedSecretKey,
    apiKeySecret,
  );

  // Verify that this was encrypted as an OAuth secret key
  if (providerName !== "oauth") {
    throw new Error("Invalid OAuth secret key - wrong provider name");
  }

  return providerKey;
}

// The standalone helpers and exported constant above have been removed
// in favour of the integrated logic inside `encryptApiKey`/`decryptApiKey`.
