"use client";

import { ExternalLink, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  walletAddress: string;
}

export function TransactionHistory({
  transactions,
  walletAddress,
}: TransactionHistoryProps) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value: string) => {
    const cro = parseFloat(value) / 1e18;
    return cro.toFixed(4);
  };

  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-cronos-secondary opacity-50" />
        <p className="text-white/70">No transactions found</p>
        <p className="text-sm text-white/50 mt-1">
          Your recent transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Recent Transactions
        </h3>
        <span className="text-sm text-white/50">
          {transactions.length} txns
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {transactions.map((tx, index) => {
          const isOutgoing =
            tx.from.toLowerCase() === walletAddress.toLowerCase();
          const isFailed = tx.isError === "1";

          return (
            <div
              key={tx.hash || index}
              className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
                isFailed ? "border border-red-500/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isFailed
                        ? "bg-red-500/20"
                        : isOutgoing
                          ? "bg-red-500/10"
                          : "bg-green-500/10"
                    }`}
                  >
                    {isOutgoing ? (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-green-400" />
                    )}
                  </div>

                  <div>
                    <p className="text-white text-sm font-medium">
                      {isOutgoing ? "Sent" : "Received"}
                      {isFailed && (
                        <span className="text-red-400 ml-2">(Failed)</span>
                      )}
                    </p>
                    <p className="text-white/50 text-xs">
                      {isOutgoing
                        ? `To: ${formatAddress(tx.to)}`
                        : `From: ${formatAddress(tx.from)}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      isOutgoing ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {isOutgoing ? "-" : "+"}
                    {formatValue(tx.value)} CRO
                  </p>
                  <p className="text-white/40 text-xs">
                    {formatDate(tx.timeStamp)}
                  </p>
                </div>
              </div>

              {/* Explorer link */}
              <a
                href={`https://explorer.cronos.org/testnet/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cronos-secondary text-xs mt-2 hover:underline"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
