"use client";

import {
  tamboRegisteredComponents,
  tamboRegisteredTools,
} from "@/components/ui/tambo/chatwithtambo/config";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_DASH_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={tamboRegisteredComponents}
      tools={tamboRegisteredTools}
    >
      {children}
    </TamboProvider>
  );
}
