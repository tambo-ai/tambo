/**
 * Maps config paths to environment variable names.
 * This allows backward compatibility with existing env var conventions.
 *
 * Format: "config.path.here": "ENV_VAR_NAME"
 */
export const ENV_VAR_MAPPING: Record<string, string> = {
  // Path overrides
  "paths.config": "TAMBO_CONFIG_DIR",
  "paths.data": "TAMBO_DATA_DIR",
  "paths.cache": "TAMBO_CACHE_DIR",
  "paths.state": "TAMBO_STATE_DIR",
  "paths.temp": "TAMBO_TEMP_DIR",

  // Database
  "database.url": "DATABASE_URL",
  "database.poolSize": "DATABASE_POOL_SIZE",

  // Secrets
  "secrets.apiKey": "API_KEY_SECRET",
  "secrets.providerKey": "PROVIDER_KEY_SECRET",

  // Auth
  "auth.secret": "NEXTAUTH_SECRET",
  "auth.url": "NEXTAUTH_URL",
  "auth.github.clientId": "GITHUB_CLIENT_ID",
  "auth.github.clientSecret": "GITHUB_CLIENT_SECRET",
  "auth.google.clientId": "GOOGLE_CLIENT_ID",
  "auth.google.clientSecret": "GOOGLE_CLIENT_SECRET",
  "auth.admin.email": "ADMIN_EMAIL",
  "auth.admin.password": "ADMIN_PASSWORD",
  "auth.allowedDomain": "ALLOWED_LOGIN_DOMAIN",
  "auth.disallowedDomains": "DISALLOWED_EMAIL_DOMAINS",

  // Integrations - Slack
  "integrations.slack.oauthToken": "SLACK_OAUTH_TOKEN",
  "integrations.slack.internalUserId": "INTERNAL_SLACK_USER_ID",

  // Integrations - Resend
  "integrations.resend.apiKey": "RESEND_API_KEY",
  "integrations.resend.audienceId": "RESEND_AUDIENCE_ID",
  "integrations.resend.fromEmail": "EMAIL_FROM_DEFAULT",

  // Integrations - GitHub
  "integrations.github.token": "GITHUB_TOKEN",

  // Integrations - PostHog
  "integrations.posthog.key": "NEXT_PUBLIC_POSTHOG_KEY",
  "integrations.posthog.host": "NEXT_PUBLIC_POSTHOG_HOST",

  // Integrations - Sentry
  "integrations.sentry.dsn": "NEXT_PUBLIC_SENTRY_DSN",
  "integrations.sentry.org": "NEXT_PUBLIC_SENTRY_ORG",
  "integrations.sentry.project": "NEXT_PUBLIC_SENTRY_PROJECT",

  // CLI
  "cli.apiUrl": "TAMBO_API_URL",
  "cli.defaultProjectId": "TAMBO_PROJECT_ID",
  "cli.components.prefix": "TAMBO_COMPONENTS_PREFIX",
  "cli.components.skipAgentDocs": "TAMBO_SKIP_AGENT_DOCS",
  "cli.output.verbose": "TAMBO_VERBOSE",

  // Whitelabel
  "whitelabel.orgName": "TAMBO_WHITELABEL_ORG_NAME",
  "whitelabel.orgLogo": "TAMBO_WHITELABEL_ORG_LOGO",
  "whitelabel.termsUrl": "NEXT_PUBLIC_TERMS_URL",
  "whitelabel.privacyUrl": "NEXT_PUBLIC_PRIVACY_URL",
  "whitelabel.licenseUrl": "NEXT_PUBLIC_LICENSE_URL",
};

/**
 * Reverse mapping: env var name to config path.
 */
export const CONFIG_PATH_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(ENV_VAR_MAPPING).map(([k, v]) => [v, k]),
);

/**
 * Get config path from env var name.
 */
export function envVarToConfigPath(envVar: string): string | undefined {
  return CONFIG_PATH_MAPPING[envVar];
}

/**
 * Get env var name from config path.
 */
export function configPathToEnvVar(configPath: string): string | undefined {
  return ENV_VAR_MAPPING[configPath];
}

/**
 * Get all env var names that are mapped.
 */
export function getAllMappedEnvVars(): string[] {
  return Object.values(ENV_VAR_MAPPING);
}
