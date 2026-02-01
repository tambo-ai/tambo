/**
 * Environment validation for the starter template.
 * Validates required environment variables and provides helpful error messages.
 */

interface EnvConfig {
  tamboApiKey: string;
  appwriteProjectId: string;
  appwriteEndpoint: string;
  appwriteDatabaseId: string;
  appwriteCollectionId: string;
}

interface EnvValidationResult {
  isValid: boolean;
  config: EnvConfig | null;
  missingVars: string[];
  errors: string[];
}

const ENV_VAR_HELP: Record<string, string> = {
  NEXT_PUBLIC_TAMBO_API_KEY: "Get from https://app.tambo.co/dashboard",
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: "Get from Appwrite Console → Settings",
  NEXT_PUBLIC_APPWRITE_ENDPOINT:
    "Get from Appwrite Console → Settings → API Endpoint",
  NEXT_PUBLIC_APPWRITE_DATABASE_ID:
    "Get from Appwrite Console → Databases → Your Database",
  NEXT_PUBLIC_APPWRITE_COLLECTION_ID:
    "Get from Appwrite Console → Databases → Your Collection",
};

export function validateEnv(): EnvValidationResult {
  const missingVars: string[] = [];
  const errors: string[] = [];

  const requiredVars = [
    "NEXT_PUBLIC_TAMBO_API_KEY",
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
    "NEXT_PUBLIC_APPWRITE_COLLECTION_ID",
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === "") {
      missingVars.push(varName);
      errors.push(`${varName} is missing. ${ENV_VAR_HELP[varName]}`);
    }
  }

  if (missingVars.length > 0) {
    return {
      isValid: false,
      config: null,
      missingVars,
      errors,
    };
  }

  return {
    isValid: true,
    config: {
      tamboApiKey: process.env.NEXT_PUBLIC_TAMBO_API_KEY!,
      appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
      appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
      appwriteDatabaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      appwriteCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
    },
    missingVars: [],
    errors: [],
  };
}

export function getEnvHelp(varName: string): string {
  return ENV_VAR_HELP[varName] || "";
}
