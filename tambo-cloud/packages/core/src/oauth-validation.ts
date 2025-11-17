/**
 * OAuth token validation modes for projects
 */
export enum OAuthValidationMode {
  /** No validation - tokens are accepted as-is. Useful for symmetric keys where private key is not available */
  NONE = "none",
  /** Validation with symmetric keys (like HS256) - requires a secret key to be stored */
  SYMMETRIC = "symmetric",
  /** Validation with asymmetric keys - uses OpenID discovery to automatically fetch public keys */
  ASYMMETRIC_AUTO = "asymmetric_auto",
  /** Validation with asymmetric keys - uses a manually provided public key */
  ASYMMETRIC_MANUAL = "asymmetric_manual",
}

/**
 * OAuth validation settings for a project
 */
export interface OAuthValidationSettings {
  mode: OAuthValidationMode;
  secretKey?: string;
  publicKey?: string;
}
