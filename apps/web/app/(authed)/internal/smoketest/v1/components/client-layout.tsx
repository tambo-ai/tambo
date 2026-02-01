"use client";

import { env } from "@/lib/env";
import { TamboV1Provider } from "@tambo-ai/react/v1";
import { useSearchParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";

export const ClientLayout: FC<
  PropsWithChildren<{ userToken: string | undefined }>
> = ({ children, userToken }) => {
  const params = useSearchParams();
  const mcpServers = params.getAll("mcpServers");
  const mcpServersArray = mcpServers.length > 0 ? mcpServers : [];
  return (
    <TamboV1Provider
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      apiKey={env.NEXT_PUBLIC_SMOKETEST_TAMBO_API_KEY!}
      userToken={userToken}
      userKey="smoketest-v1-user" // TODO: Remove hardcoded userKey once token exchange is working
      mcpServers={mcpServersArray}
    >
      {children}
    </TamboV1Provider>
  );
};
