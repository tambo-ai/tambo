import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import {
  decryptOAuthSecretKey,
  McpAccessTokenPayload,
  OAuthValidationMode,
  OidcProviderConfig,
  SessionlessMcpAccessTokenPayload,
  TAMBO_MCP_ACCESS_KEY_CLAIM,
} from "@tambo-ai-cloud/core";
import {
  createRemoteJWKSet,
  decodeJwt,
  importJWK,
  importSPKI,
  importX509,
  JWTPayload,
  jwtVerify,
} from "jose";
import { CorrelationLoggerService } from "../services/logger.service";

// Security constants
const ALLOWED_SYMMETRIC_ALGORITHMS = ["HS256", "HS384", "HS512"];
const ALLOWED_ASYMMETRIC_ALGORITHMS = [
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
];
const FETCH_TIMEOUT_MS = 5000;
const MAX_JSON_SIZE = 10000; // 10KB limit for JSON parsing

// Allowed issuer domains - configure based on your requirements
const _ALLOWED_ISSUER_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "auth0.com",
  // Add your trusted OAuth providers here
];

/**
 * Validates that a URL is safe for external requests (prevents SSRF)
 */
function validateExternalUrl(url: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new UnauthorizedException("Invalid issuer URL format");
  }

  // Only allow HTTPS
  if (parsedUrl.protocol !== "https:") {
    throw new UnauthorizedException("OAuth issuer must use HTTPS");
  }

  // Prevent internal/private network access
  const hostname = parsedUrl.hostname.toLowerCase();

  // Block localhost and loopback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("127.")
  ) {
    throw new UnauthorizedException("OAuth issuer cannot be localhost");
  }

  // Block private networks
  if (
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    (hostname.startsWith("172.") && /^172\.(1[6-9]|2\d|3[01])\./.test(hostname))
  ) {
    throw new UnauthorizedException(
      "OAuth issuer cannot be in private network",
    );
  }

  // Block metadata services
  if (
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal"
  ) {
    throw new UnauthorizedException("OAuth issuer cannot be metadata service");
  }

  // Optional: Enforce allowed domains (uncomment if you want strict domain allowlist)
  // const isAllowedDomain = _ALLOWED_ISSUER_DOMAINS.some(domain =>
  //   hostname === domain || hostname.endsWith('.' + domain)
  // );
  // if (!isAllowedDomain) {
  //   throw new UnauthorizedException(`OAuth issuer domain not allowed: ${hostname}`);
  // }
}

/**
 * Makes a fetch request with timeout and security checks
 */
async function secureFetch(url: string): Promise<Response> {
  validateExternalUrl(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Tambo-OAuth-Validator/1.0",
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new UnauthorizedException("OAuth configuration request timeout");
    }
    throw error;
  }
}

/**
 * Validates and verifies an OAuth subject token based on the configured validation mode
 */
export async function validateSubjectToken(
  subjectToken: string,
  validationMode: OAuthValidationMode,
  oauthSettings: {
    secretKeyEncrypted?: string | null;
    publicKey?: string | null;
  } | null,
  logger: CorrelationLoggerService,
): Promise<JWTPayload> {
  // Basic input validation
  if (!subjectToken || typeof subjectToken !== "string") {
    throw new BadRequestException("Invalid subject token format");
  }

  if (subjectToken.length > 8192) {
    // 8KB limit for JWTs
    throw new BadRequestException("Subject token too large");
  }

  // Ensure API_KEY_SECRET is available for encryption operations
  if (!process.env.API_KEY_SECRET) {
    logger.error("API_KEY_SECRET environment variable not set");
    throw new UnauthorizedException("Server configuration error");
  }

  switch (validationMode) {
    case OAuthValidationMode.NONE: {
      const payload = decodeJwt(subjectToken);

      // Even in NONE mode, we should check token expiry for security
      if (payload.exp && typeof payload.exp === "number") {
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime) {
          throw new UnauthorizedException("Token has expired");
        }
      }

      return payload;
    }

    case OAuthValidationMode.SYMMETRIC: {
      if (!oauthSettings?.secretKeyEncrypted) {
        throw new UnauthorizedException(
          "OAuth symmetric validation configured but no secret key found",
        );
      }

      const secretKey = decryptOAuthSecretKey(
        oauthSettings.secretKeyEncrypted,
        process.env.API_KEY_SECRET,
      );

      if (!secretKey || secretKey.length < 32) {
        throw new UnauthorizedException(
          "OAuth secret key too short or invalid",
        );
      }

      const symmetricKey = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(subjectToken, symmetricKey, {
        algorithms: ALLOWED_SYMMETRIC_ALGORITHMS,
      });
      return payload;
    }

    case OAuthValidationMode.ASYMMETRIC_MANUAL: {
      if (!oauthSettings?.publicKey) {
        throw new UnauthorizedException(
          "OAuth asymmetric manual validation configured but no public key found",
        );
      }

      if (oauthSettings.publicKey.length > MAX_JSON_SIZE) {
        throw new UnauthorizedException("Public key configuration too large");
      }

      try {
        // Parse the public key (assuming it's in JWK format)
        const publicKey = await readPublicKey(oauthSettings.publicKey);
        const { payload } = await jwtVerify(subjectToken, publicKey, {
          algorithms: ALLOWED_ASYMMETRIC_ALGORITHMS,
        });
        return payload;
      } catch (error) {
        logger.error(
          `Error parsing or using manual public key: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw new UnauthorizedException("Invalid public key configuration");
      }
    }

    case OAuthValidationMode.ASYMMETRIC_AUTO: {
      const payload = decodeJwt(subjectToken);

      if (!payload.iss || typeof payload.iss !== "string") {
        throw new BadRequestException(
          "Subject token missing or invalid issuer (iss)",
        );
      }

      // Validate issuer format and security
      let issuerUrl: URL;
      try {
        issuerUrl = new URL(payload.iss);
      } catch {
        throw new BadRequestException(
          "Subject token has invalid issuer URL format",
        );
      }

      // Security check: ensure issuer doesn't end with path that could be exploited
      if (issuerUrl.pathname !== "/" && issuerUrl.pathname !== "") {
        throw new BadRequestException(
          "Subject token issuer cannot contain path components",
        );
      }

      // Fetch OpenID configuration with security checks
      const openidConfigUrl = `${payload.iss}/.well-known/openid-configuration`;
      logger.log(`Fetching OpenID configuration from verified URL`);

      const configResponse = await secureFetch(openidConfigUrl);
      if (!configResponse.ok) {
        logger.error(
          `Failed to fetch OpenID configuration: ${configResponse.statusText}`,
        );
        throw new UnauthorizedException(
          "Failed to fetch OAuth provider configuration",
        );
      }

      const openidConfig = (await configResponse.json()) as OidcProviderConfig;
      if (!openidConfig.jwks_uri || typeof openidConfig.jwks_uri !== "string") {
        throw new UnauthorizedException(
          "OAuth provider configuration missing or invalid jwks_uri",
        );
      }

      // Validate JWKS URI as well
      validateExternalUrl(openidConfig.jwks_uri);

      // Create JWKS and verify the token with algorithm restrictions
      const JWKS = createRemoteJWKSet(new URL(openidConfig.jwks_uri));
      const { payload: verifiedPayload } = await jwtVerify(subjectToken, JWKS, {
        issuer: payload.iss,
        algorithms: ALLOWED_ASYMMETRIC_ALGORITHMS,
      });

      return verifiedPayload;
    }

    default:
      throw new UnauthorizedException(
        `Unsupported OAuth validation mode: ${validationMode}`,
      );
  }
}

/** Allows for both JWK and PEM formatted public keys */
async function readPublicKey(publicKeyString: string) {
  if (publicKeyString.startsWith("{")) {
    // JWK formatted public key
    const publicKeyJWK = JSON.parse(publicKeyString);

    // Validate it's actually a public key
    if (publicKeyJWK.kty && (publicKeyJWK.d || publicKeyJWK.k)) {
      throw new UnauthorizedException(
        "Private or symmetric key provided where public key expected",
      );
    }

    const publicKey = await importJWK(publicKeyJWK);
    return publicKey;
  }
  // PEM formatted public key - try SPKI or X.509 certificate
  const trimmed = publicKeyString.trim();
  if (trimmed.includes("BEGIN CERTIFICATE")) {
    // In Node.js alg is not enforced; provide a common default for types
    return await importX509(trimmed, "RS256");
  }
  // Covers "BEGIN PUBLIC KEY", "BEGIN RSA PUBLIC KEY", "BEGIN EC PUBLIC KEY"
  return await importSPKI(trimmed, "RS256");
}

export async function extractAndVerifyMcpAccessToken(
  token: string,
  secret: string,
): Promise<McpAccessTokenPayload | SessionlessMcpAccessTokenPayload> {
  const signingKey = new TextEncoder().encode(secret);
  const { payload: verifiedPayload } = await jwtVerify(token, signingKey, {
    algorithms: ALLOWED_SYMMETRIC_ALGORITHMS,
  });
  if (!verifiedPayload.iss || !verifiedPayload.sub) {
    throw new Error("MCP access token missing required claims (iss or sub)");
  }
  const claim = verifiedPayload[TAMBO_MCP_ACCESS_KEY_CLAIM] as
    | McpAccessTokenPayload[typeof TAMBO_MCP_ACCESS_KEY_CLAIM]
    | SessionlessMcpAccessTokenPayload[typeof TAMBO_MCP_ACCESS_KEY_CLAIM]
    | undefined;
  if (!claim) {
    throw new Error("MCP access token missing required claim");
  }
  if (verifiedPayload.iss !== claim.projectId) {
    throw new Error("Issuer does not match MCP claim projectId");
  }

  // Check if this is a session-less token by presence of contextKey
  if ("contextKey" in claim && claim.contextKey) {
    // Validate session-less token structure
    const expectedSub = `${claim.projectId}:sessionless`;
    if (verifiedPayload.sub !== expectedSub) {
      throw new Error("Subject does not match session-less MCP claim");
    }
    return verifiedPayload as SessionlessMcpAccessTokenPayload;
  }

  // Validate thread-bound token structure
  if (!("threadId" in claim) || !claim.threadId) {
    throw new Error("Thread-bound MCP token missing threadId");
  }
  const expectedSub = `${claim.projectId}:${claim.threadId}`;
  if (verifiedPayload.sub !== expectedSub) {
    throw new Error("Subject does not match MCP claim");
  }
  return verifiedPayload as McpAccessTokenPayload;
}
