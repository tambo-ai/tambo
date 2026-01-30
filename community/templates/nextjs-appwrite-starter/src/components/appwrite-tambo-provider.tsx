"use client";

import { account } from "@/lib/appwrite";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { Models } from "appwrite";
import { useEffect, useState } from "react";

interface AppwriteTamboProviderProps {
  children: React.ReactNode;
}

export function AppwriteTamboProvider({
  children,
}: AppwriteTamboProviderProps) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      // Pass Appwrite user context to Tambo
      user={user ? { id: user.$id, email: user.email } : undefined}
    >
      {children}
    </TamboProvider>
  );
}
