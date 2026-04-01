"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";
import { useSession } from "next-auth/react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  const { data: session } = useSession();
  const userToken = session?.user?.userToken;

  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_DASH_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={tamboRegisteredComponents}
      userToken={userToken}
      contextHelpers={{
        userPage: currentPageContextHelper,
      }}
    >
      {children}
    </TamboProvider>
  );
}
