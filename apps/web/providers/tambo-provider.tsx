"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
  userToken?: string;
}>;

export function TamboProviderWrapper({
  children,
  userToken,
}: TamboProviderWrapperProps) {
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
