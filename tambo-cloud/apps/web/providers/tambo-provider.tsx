"use client";

import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { env } from "@/lib/env";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_DASH_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={tamboRegisteredComponents}
      contextHelpers={{
        userPage: currentPageContextHelper,
      }}
    >
      {children}
    </TamboProvider>
  );
}
