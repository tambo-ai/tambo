"use client";

import { useAccount, useBalance, useChainId } from "wagmi";
import { Wallet, Network, Coins } from "lucide-react";
import { formatCRO, CRONOS_MAINNET, CRONOS_TESTNET } from "@/config/wagmi";
import { useState, useEffect } from "react";

interface WalletCardProps {
  showNetwork?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export function WalletCard({
  showNetwork = true,
  variant = "default",
}: WalletCardProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="glass rounded-xl p-6 text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-3 bg-white/10 rounded-full" />
        <div className="h-4 bg-white/10 rounded w-32 mx-auto" />
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Wallet className="w-12 h-12 mx-auto mb-3 text-cronos-secondary opacity-50" />
        <p className="text-white/70">No wallet connected</p>
        <p className="text-sm text-white/50 mt-1">
          Connect your wallet to view details
        </p>
      </div>
    );
  }

  const networkName =
    chainId === CRONOS_MAINNET.id
      ? "Cronos Mainnet"
      : chainId === CRONOS_TESTNET.id
        ? "Cronos Testnet"
        : "Unknown Network";

  const networkColor =
    chainId === CRONOS_MAINNET.id ? "text-green-400" : "text-yellow-400";

  const formattedBalance = balance ? formatCRO(balance.value) : "0.0000";

  if (variant === "compact") {
    return (
      <div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
        <Wallet className="w-5 h-5 text-cronos-secondary" />
        <span className="text-white/80 font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="ml-auto font-semibold text-cronos-secondary">
          {formattedBalance} CRO
        </span>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-sm">Connected Wallet</p>
            <p className="font-mono text-white">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
        </div>
        {showNetwork && (
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-white/60" />
            <span className={`text-sm font-medium ${networkColor}`}>
              {networkName}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cronos-secondary" />
            <span className="text-white/60">Balance</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">
              {formattedBalance} CRO
            </p>
            {variant === "detailed" && balance && (
              <p className="text-sm text-white/50">
                ≈ ${(parseFloat(formattedBalance) * 0.08).toFixed(2)} USD
              </p>
            )}
          </div>
        </div>
      </div>

      {variant === "detailed" && (
        <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/50">Chain ID</p>
            <p className="text-white font-mono">{chainId}</p>
          </div>
          <div>
            <p className="text-white/50">Currency</p>
            <p className="text-white">{balance?.symbol || "CRO"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
