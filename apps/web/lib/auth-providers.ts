import { Icons } from "@/components/icons";

export interface AuthProviderConfig {
  id: string;
  name: string;
  displayName: string;
  icon: keyof typeof Icons;
  color?: string;
}

export const authProviderConfigs: Record<string, AuthProviderConfig> = {
  github: {
    id: "github",
    name: "GitHub",
    displayName: "Sign in with GitHub",
    icon: "github",
  },
  google: {
    id: "google",
    name: "Google",
    displayName: "Sign in with Google",
    icon: "google",
  },
  email: {
    id: "email",
    name: "Email",
    displayName: "Continue with Email",
    icon: "mail",
  },
};

export function getProviderConfig(
  providerId: string,
): AuthProviderConfig | undefined {
  return authProviderConfigs[providerId];
}

export function getAvailableProviderConfigs(
  providerIds: string[],
): AuthProviderConfig[] {
  return providerIds
    .map((id) => getProviderConfig(id))
    .filter((config): config is AuthProviderConfig => config !== undefined);
}
