"use client";

import { TrendingUp, TrendingDown, Coins } from "lucide-react";

interface TokenBalanceProps {
  symbol: string;
  balance: string;
  usdValue?: string;
  change24h?: number;
}

const TOKEN_ICONS: Record<string, string> = {
  CRO: "🔷",
  USDC: "💵",
  USDT: "💴",
  ETH: "💎",
  BTC: "🪙",
  WCRO: "🔶",
};

export function TokenBalance({
  symbol,
  balance,
  usdValue,
  change24h,
}: TokenBalanceProps) {
  const icon = TOKEN_ICONS[symbol.toUpperCase()] || "🪙";
  const isPositive = change24h && change24h >= 0;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cronos-primary to-cronos-accent flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{symbol}</p>
            {change24h !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">{balance}</p>
          {usdValue && (
            <p className="text-white/50 text-sm">≈ ${usdValue} USD</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white/50">
            <Coins className="w-4 h-4" />
            <span>Holdings</span>
          </div>
          <span className="text-white font-mono">
            {parseFloat(balance).toLocaleString()} {symbol}
          </span>
        </div>
      </div>
    </div>
  );
}
