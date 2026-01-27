"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { CRONOS_MAINNET, CRONOS_TESTNET } from "@/config/wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch - only render wallet state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const networkName =
    chainId === CRONOS_MAINNET.id
      ? "Cronos"
      : chainId === CRONOS_TESTNET.id
        ? "Testnet"
        : "Unknown";

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cronos-secondary to-cronos-accent opacity-50"
      >
        <Wallet className="w-5 h-5" />
        <span className="font-medium">Connect Wallet</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cronos-secondary/20 to-cronos-accent/20 border border-cronos-secondary/30 hover:border-cronos-secondary/50 transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-sm">{networkName}</span>
          <span className="font-mono text-white">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-xl z-50">
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cronos-secondary to-cronos-accent hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Wallet className="w-5 h-5" />
        <span className="font-medium">
          {isPending ? "Connecting..." : "Connect Wallet"}
        </span>
      </button>

      {showDropdown && !isPending && (
        <div className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-xl z-50 p-2">
          <p className="px-3 py-2 text-white/50 text-sm">Choose Wallet</p>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-cronos-secondary" />
              </div>
              <span className="text-white">{connector.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
