"use client";

import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { FC, PropsWithChildren } from "react";

const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <TamboProvider
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL!}
      apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
    >
      {children}
    </TamboProvider>
  );
};
export default Layout;
