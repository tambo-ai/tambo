"use client";

import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
  userToken?: string;
}

export default function ClientLayout({
  children,
  userToken,
}: ClientLayoutProps) {
  const { data: session } = useSession();

  return (
    //  TamboProvider need :
    //   Usertoken in order to deal with user authentication
    // apikey in order to deal with the api calls
    // tools in order to deal with the tools
    // components in order to deal with the components
    // contextHelpers in order to deal with the context helpers
    <TamboProvider
      userToken={userToken}
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
      components={components}
      contextHelpers={{
        user: async () => {
          if (!session?.user) return null;
          return {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          };
        },
      }}
    >
      {children}
    </TamboProvider>
  );
}
