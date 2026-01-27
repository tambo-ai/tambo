import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { WalletCard } from "@/components/tambo/WalletCard";
import { TransactionCard } from "@/components/tambo/TransactionCard";
import { TokenBalance } from "@/components/tambo/TokenBalance";
import { TransactionHistory } from "@/components/tambo/TransactionHistory";
import { TokenPrice } from "@/components/tambo/TokenPrice";
import { GasEstimator } from "@/components/tambo/GasEstimator";

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
      "Displays a single transaction with hash, status, from/to addresses, and amount. Use when showing a specific transaction detail.",
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
    name: "TransactionHistory",
    description:
      "Displays a list of recent transactions for a wallet. Use when user asks about their transaction history, recent transactions, or activity. Pass the transactions array from the getTransactionHistory tool.",
    component: TransactionHistory,
    propsSchema: z.object({
      transactions: z
        .array(
          z.object({
            hash: z.string(),
            from: z.string(),
            to: z.string(),
            value: z.string(),
            timeStamp: z.string(),
            isError: z.string(),
          }),
        )
        .describe("Array of transaction objects"),
      walletAddress: z
        .string()
        .describe("The wallet address to identify sent vs received"),
    }),
  },
  {
    name: "TokenBalance",
    description:
      "Shows token balance with icon and USD value estimation. Use when user asks about specific token holdings.",
    component: TokenBalance,
    propsSchema: z.object({
      symbol: z.string().describe("Token symbol (e.g., CRO, USDC)"),
      balance: z.string().describe("Token balance amount"),
      usdValue: z.string().optional().describe("Estimated USD value"),
      change24h: z.number().optional().describe("24h price change percentage"),
    }),
  },
  {
    name: "TokenPrice",
    description:
      "Displays live token price with 24h change, market cap, volume, and high/low. Use when user asks about CRO price, crypto price, or market data.",
    component: TokenPrice,
    propsSchema: z.object({
      symbol: z.string().describe("Token symbol (e.g., CRO)"),
      price: z.number().describe("Current price in USD"),
      change24h: z.number().describe("24h price change percentage"),
      marketCap: z.number().optional().describe("Market capitalization in USD"),
      volume24h: z.number().optional().describe("24h trading volume in USD"),
      high24h: z.number().optional().describe("24h high price"),
      low24h: z.number().optional().describe("24h low price"),
    }),
  },
  {
    name: "GasEstimator",
    description:
      "Shows current gas prices (slow, standard, fast) with estimated transaction costs. Use when user asks about gas prices, gas fees, or transaction costs on Cronos.",
    component: GasEstimator,
    propsSchema: z.object({
      slow: z.number().describe("Slow gas price in Gwei"),
      standard: z.number().describe("Standard gas price in Gwei"),
      fast: z.number().describe("Fast gas price in Gwei"),
      baseFee: z.number().optional().describe("Base fee in Gwei"),
      lastUpdated: z.string().optional().describe("Timestamp of last update"),
    }),
  },
];

// Tools that AI can call to fetch data
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
        testnetExplorer: "https://explorer.cronos.org/testnet/",
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
  {
    name: "getTransactionHistory",
    description:
      "Fetches recent transactions for a wallet address from Cronoscan. Use when user asks about their transaction history or recent activity. Returns array of transactions to display with TransactionHistory component.",
    tool: async ({
      address,
      isTestnet,
    }: {
      address: string;
      isTestnet: boolean;
    }) => {
      try {
        const baseUrl = isTestnet
          ? "https://api-testnet.cronoscan.com/api"
          : "https://api.cronoscan.com/api";

        const response = await fetch(
          `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`,
        );

        const data = await response.json();

        if (data.status === "1" && data.result) {
          return {
            success: true,
            transactions: data.result.slice(0, 10),
            address: address,
          };
        }

        return {
          success: false,
          transactions: [],
          address: address,
          message: "No transactions found or API error",
        };
      } catch (error) {
        return {
          success: false,
          transactions: [],
          address: address,
          message: "Failed to fetch transactions",
        };
      }
    },
    inputSchema: z.object({
      address: z.string().describe("Wallet address to fetch transactions for"),
      isTestnet: z.boolean().describe("Whether to use testnet or mainnet API"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      transactions: z.array(z.any()),
      address: z.string(),
      message: z.string().optional(),
    }),
  },
  {
    name: "getCROPrice",
    description:
      "Fetches live CRO token price from CoinGecko API. Use when user asks about CRO price, current price, or market data. Display results with TokenPrice component.",
    tool: async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/crypto-com-chain?localization=false&tickers=false&community_data=false&developer_data=false",
        );

        const data = await response.json();

        return {
          success: true,
          symbol: "CRO",
          price: data.market_data.current_price.usd,
          change24h: data.market_data.price_change_percentage_24h,
          marketCap: data.market_data.market_cap.usd,
          volume24h: data.market_data.total_volume.usd,
          high24h: data.market_data.high_24h.usd,
          low24h: data.market_data.low_24h.usd,
        };
      } catch (error) {
        // Return fallback data if API fails
        return {
          success: false,
          symbol: "CRO",
          price: 0.08,
          change24h: 0,
          marketCap: 2000000000,
          volume24h: 50000000,
          high24h: 0.082,
          low24h: 0.078,
          message: "Using cached data - API unavailable",
        };
      }
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      symbol: z.string(),
      price: z.number(),
      change24h: z.number(),
      marketCap: z.number(),
      volume24h: z.number(),
      high24h: z.number(),
      low24h: z.number(),
      message: z.string().optional(),
    }),
  },
  {
    name: "getGasPrices",
    description:
      "Fetches current gas prices on Cronos network. Use when user asks about gas prices, gas fees, or transaction costs. Display results with GasEstimator component.",
    tool: async ({ isTestnet }: { isTestnet: boolean }) => {
      try {
        // Cronos typically has low, stable gas prices
        // In production, you'd fetch from an oracle or node
        const baseGas = isTestnet ? 5000 : 5000; // Cronos base gas in Gwei

        return {
          success: true,
          slow: Math.round(baseGas * 0.8),
          standard: baseGas,
          fast: Math.round(baseGas * 1.2),
          baseFee: baseGas,
          lastUpdated: new Date().toLocaleTimeString(),
          network: isTestnet ? "Cronos Testnet" : "Cronos Mainnet",
        };
      } catch (error) {
        return {
          success: false,
          slow: 4000,
          standard: 5000,
          fast: 6000,
          baseFee: 5000,
          lastUpdated: new Date().toLocaleTimeString(),
          network: isTestnet ? "Cronos Testnet" : "Cronos Mainnet",
          message: "Using estimated values",
        };
      }
    },
    inputSchema: z.object({
      isTestnet: z
        .boolean()
        .describe("Whether to get testnet or mainnet gas prices"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      slow: z.number(),
      standard: z.number(),
      fast: z.number(),
      baseFee: z.number(),
      lastUpdated: z.string(),
      network: z.string(),
      message: z.string().optional(),
    }),
  },
];
