import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { WalletCard } from "@/components/tambo/WalletCard";
import { TransactionCard } from "@/components/tambo/TransactionCard";
import { TokenBalance } from "@/components/tambo/TokenBalance";

// Register Tambo components that AI can render
export const components: TamboComponent[] = [
  {
    name: "WalletCard",
    description:
      "ALWAYS use this component when user asks about their wallet, balance, CRO, address, or connection status. This component automatically detects the connected wallet and displays the address, CRO balance, and network info.",
    component: WalletCard,
    propsSchema: z.object({
      showNetwork: z
        .boolean()
        .optional()
        .describe("Whether to show the current network (default: true)"),
      variant: z
        .enum(["default", "compact", "detailed"])
        .optional()
        .describe(
          "Visual variant: 'default' for normal view, 'compact' for inline, 'detailed' for full info with USD value",
        ),
    }),
  },
  {
    name: "TransactionCard",
    description:
      "Displays a transaction with hash, status, from/to addresses, and amount. Use when showing transaction details or demonstrating a sample transaction.",
    component: TransactionCard,
    propsSchema: z.object({
      hash: z.string().describe("Transaction hash"),
      from: z.string().describe("Sender address"),
      to: z.string().describe("Recipient address"),
      value: z.string().describe("Transaction value in CRO"),
      status: z
        .enum(["pending", "confirmed", "failed"])
        .describe("Transaction status"),
      timestamp: z.number().optional().describe("Unix timestamp"),
    }),
  },
  {
    name: "TokenBalance",
    description:
      "Shows token balance with icon and USD value estimation. Use when user asks about specific token holdings or wants to see token info.",
    component: TokenBalance,
    propsSchema: z.object({
      symbol: z.string().describe("Token symbol (e.g., CRO, USDC)"),
      balance: z.string().describe("Token balance amount"),
      usdValue: z.string().optional().describe("Estimated USD value"),
      change24h: z.number().optional().describe("24h price change percentage"),
    }),
  },
];

// Tools are now minimal since components handle the display
export const tools: TamboTool[] = [
  {
    name: "getCronosNetworkInfo",
    description:
      "Returns information about the Cronos blockchain network. Use when user asks about Cronos network details.",
    tool: async () => {
      return {
        network: "Cronos Mainnet",
        chainId: 25,
        currency: "CRO",
        explorer: "https://cronoscan.com",
        rpc: "https://evm.cronos.org",
        testnetChainId: 338,
        testnetExplorer: "https://testnet.cronoscan.com",
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      network: z.string(),
      chainId: z.number(),
      currency: z.string(),
      explorer: z.string(),
      rpc: z.string(),
      testnetChainId: z.number(),
      testnetExplorer: z.string(),
    }),
  },
];
