"use client";

import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { useSearchParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";

export const ClientLayout: FC<
  PropsWithChildren<{ userToken: string | undefined }>
> = ({ children, userToken }) => {
  const params = useSearchParams();
  const mcpServers = params.getAll("mcpServers");
  const mcpServersArray = mcpServers.length > 0 ? mcpServers : [];
  return (
    <TamboProvider
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      apiKey={env.NEXT_PUBLIC_SMOKETEST_TAMBO_API_KEY!}
      userToken={userToken}
      mcpServers={mcpServersArray}
    >
      {children}
    </TamboProvider>
  );
};
