"use client";

import { env } from "@/lib/env";
import { HydraProvider } from "@hydra-ai/react";
import { FC, PropsWithChildren } from "react";

const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <HydraProvider
      hydraUrl={env.NEXT_PUBLIC_HYDRA_API_URL!}
      apiKey={env.NEXT_PUBLIC_HYDRA_API_KEY!}
    >
      {children}
    </HydraProvider>
  );
};
export default Layout;
