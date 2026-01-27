"use client";

import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface TransactionCardProps {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: "pending" | "confirmed" | "failed";
  timestamp?: number;
}

export function TransactionCard({
  hash,
  from,
  to,
  value,
  status,
  timestamp,
}: TransactionCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      label: "Pending",
    },
    confirmed: {
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      label: "Confirmed",
    },
    failed: {
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      label: "Failed",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const explorerUrl = `https://cronoscan.com/tx/${hash}`;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <p className="text-white font-medium">Transaction</p>
            <p className="text-white/50 text-sm font-mono">
              {formatAddress(hash)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ArrowUpRight className="w-4 h-4 text-red-400" />
          <div className="flex-1">
            <p className="text-white/50 text-xs">From</p>
            <p className="text-white font-mono text-sm">{formatAddress(from)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ArrowDownLeft className="w-4 h-4 text-green-400" />
          <div className="flex-1">
            <p className="text-white/50 text-xs">To</p>
            <p className="text-white font-mono text-sm">{formatAddress(to)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs">Amount</p>
          <p className="text-xl font-bold gradient-text">{value} CRO</p>
        </div>
        <div className="text-right">
          {timestamp && (
            <p className="text-white/50 text-sm">{formatDate(timestamp)}</p>
          )}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cronos-secondary hover:text-cronos-accent transition-colors text-sm mt-1"
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
