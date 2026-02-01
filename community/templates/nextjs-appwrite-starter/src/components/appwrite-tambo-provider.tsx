"use client";

import { EnvError } from "@/components/env-error";
import { account } from "@/lib/appwrite";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useEffect, useState, type ReactNode } from "react";

interface AppwriteTamboProviderProps {
  children: ReactNode;
}

// Environment variables - must be accessed directly (not dynamically) in Next.js
const ENV_VALUES = {
  NEXT_PUBLIC_TAMBO_API_KEY: process.env.NEXT_PUBLIC_TAMBO_API_KEY,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID:
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_COLLECTION_ID:
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
} as const;

function getMissingEnvVars(): string[] {
  const missing: string[] = [];

  if (!ENV_VALUES.NEXT_PUBLIC_TAMBO_API_KEY) {
    missing.push("NEXT_PUBLIC_TAMBO_API_KEY");
  }
  if (!ENV_VALUES.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }
  if (!ENV_VALUES.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  }
  if (!ENV_VALUES.NEXT_PUBLIC_APPWRITE_DATABASE_ID) {
    missing.push("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
  }
  if (!ENV_VALUES.NEXT_PUBLIC_APPWRITE_COLLECTION_ID) {
    missing.push("NEXT_PUBLIC_APPWRITE_COLLECTION_ID");
  }

  return missing;
}

export function AppwriteTamboProvider({
  children,
}: AppwriteTamboProviderProps) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check env vars synchronously (they're embedded at build time)
  const missingEnvVars = getMissingEnvVars();

  useEffect(() => {
    // Skip user fetch if env is invalid
    if (missingEnvVars.length > 0) {
      setIsLoading(false);
      return;
    }

    // Fetch user session
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        setUser({ id: currentUser.$id, email: currentUser.email });
      } catch {
        // User not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [missingEnvVars.length]);

  // Show env error if missing variables
  if (missingEnvVars.length > 0) {
    return <EnvError missingVars={missingEnvVars} />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const apiKey = ENV_VALUES.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return <EnvError missingVars={["NEXT_PUBLIC_TAMBO_API_KEY"]} />;
  }

  return (
    // @ts-expect-error - TamboProvider types might be outdated but prop is required for user context
    <TamboProvider
      apiKey={apiKey}
      components={components}
      tools={tools}
      user={user ? { id: user.id, email: user.email } : undefined}
    >
      {children}
    </TamboProvider>
  );
}
