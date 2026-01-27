"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
} from "lucide-react";

interface TokenPriceProps {
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

export function TokenPrice({
  symbol,
  price,
  change24h,
  marketCap,
  volume24h,
  high24h,
  low24h,
}: TokenPriceProps) {
  const isPositive = change24h >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
            <span className="text-xl font-bold">🔷</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{symbol}</h3>
            <p className="text-white/50 text-sm">Cronos</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">
            ${price.toFixed(4)}
          </p>
          <div
            className={`flex items-center justify-end gap-1 ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isPositive ? "+" : ""}
              {change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        {marketCap && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <DollarSign className="w-4 h-4" />
              Market Cap
            </div>
            <p className="text-white font-semibold">
              {formatNumber(marketCap)}
            </p>
          </div>
        )}

        {volume24h && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <BarChart3 className="w-4 h-4" />
              24h Volume
            </div>
            <p className="text-white font-semibold">
              {formatNumber(volume24h)}
            </p>
          </div>
        )}

        {high24h && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Activity className="w-4 h-4" />
              24h High
            </div>
            <p className="text-green-400 font-semibold">
              ${high24h.toFixed(4)}
            </p>
          </div>
        )}

        {low24h && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Activity className="w-4 h-4" />
              24h Low
            </div>
            <p className="text-red-400 font-semibold">${low24h.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
