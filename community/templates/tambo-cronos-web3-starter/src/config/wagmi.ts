import { http, createConfig } from "wagmi";
import { cronos, cronosTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = createConfig({
  chains: [cronos, cronosTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [cronos.id]: http(),
    [cronosTestnet.id]: http(),
  },
});

// Export chain info for use in components
export const CRONOS_MAINNET = cronos;
export const CRONOS_TESTNET = cronosTestnet;

// Format CRO amount with proper decimals
export function formatCRO(value: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0").slice(0, 4);
  return `${integerPart}.${fractionalStr}`;
}

// Parse CRO amount to wei
export function parseCRO(value: string): bigint {
  const [integer, fraction = ""] = value.split(".");
  const decimals = 18;
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integer + paddedFraction);
}
