"use client";

import { Fuel, Zap, Clock, TrendingUp } from "lucide-react";

interface GasEstimatorProps {
  slow: number;
  standard: number;
  fast: number;
  baseFee?: number;
  lastUpdated?: string;
}

export function GasEstimator({
  slow,
  standard,
  fast,
  baseFee,
  lastUpdated,
}: GasEstimatorProps) {
  const gasOptions = [
    {
      label: "Slow",
      gwei: slow,
      time: "~5 min",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Standard",
      gwei: standard,
      time: "~1 min",
      icon: Fuel,
      color: "text-cronos-secondary",
      bgColor: "bg-cronos-secondary/10",
    },
    {
      label: "Fast",
      gwei: fast,
      time: "~15 sec",
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
  ];

  // Estimate cost for a standard transfer (21000 gas)
  const estimateCost = (gwei: number) => {
    const gasCost = (gwei * 21000) / 1e9; // Cost in CRO
    return gasCost.toFixed(6);
  };

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Gas Prices</h3>
            <p className="text-white/50 text-sm">Cronos Network</p>
          </div>
        </div>
        {baseFee && (
          <div className="text-right">
            <p className="text-white/50 text-xs">Base Fee</p>
            <p className="text-white font-mono">{baseFee} Gwei</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {gasOptions.map((option) => (
          <div
            key={option.label}
            className={`${option.bgColor} rounded-lg p-3 text-center`}
          >
            <option.icon className={`w-6 h-6 mx-auto mb-2 ${option.color}`} />
            <p className={`font-semibold ${option.color}`}>{option.label}</p>
            <p className="text-white text-lg font-bold">{option.gwei}</p>
            <p className="text-white/50 text-xs">Gwei</p>
            <p className="text-white/40 text-xs mt-1">{option.time}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-white/50 text-sm mb-2">
          Estimated Transfer Cost (21,000 gas)
        </p>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-white font-mono">{estimateCost(slow)} CRO</p>
          </div>
          <div>
            <p className="text-white font-mono">{estimateCost(standard)} CRO</p>
          </div>
          <div>
            <p className="text-white font-mono">{estimateCost(fast)} CRO</p>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-white/30 text-xs text-center">
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
  );
}
