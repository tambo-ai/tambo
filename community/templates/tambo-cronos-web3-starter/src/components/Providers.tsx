"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useBalance, useChainId } from "wagmi";
import { TamboProvider } from "@tambo-ai/react";
import { config } from "@/config/wagmi";
import { components, tools } from "@/lib/tambo";
import { useState } from "react";

// Inner component that has access to wagmi hooks
function TamboWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const isTestnet = chainId === 338;

  // Context helpers pass real-time wallet state to Tambo AI
  const contextHelpers = {
    walletStatus: () => ({
      key: "walletStatus",
      value: isConnected
        ? `Connected: ${address}, Chain ID: ${chainId}, Balance: ${balance?.formatted || "0"} ${balance?.symbol || "CRO"}`
        : "Wallet not connected",
    }),
    currentAddress: () => ({
      key: "currentAddress",
      value: address || "No wallet connected",
    }),
    currentNetwork: () => ({
      key: "currentNetwork",
      value:
        chainId === 25
          ? "Cronos Mainnet"
          : chainId === 338
            ? "Cronos Testnet"
            : `Chain ${chainId}`,
    }),
    isTestnet: () => ({
      key: "isTestnet",
      value: isTestnet ? "true" : "false",
    }),
    walletAddress: () => ({
      key: "walletAddress",
      value: address || "",
    }),
  };

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY || ""}
      components={components}
      tools={tools}
      contextHelpers={contextHelpers}
    >
      {children}
    </TamboProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TamboWrapper>{children}</TamboWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
