# Tambo Cronos Web3 Starter

AI-powered Web3 chat interface for the Cronos blockchain, built with Next.js, Tambo, and Wagmi.

![Tambo Cronos Web3 Starter Screenshot](https://github.com/user-attachments/assets/PLACEHOLDER_SCREENSHOT_URL)

## 🎥 Video Demo

[Watch the demo video](https://github.com/user-attachments/assets/PLACEHOLDER_VIDEO_URL)

## What This Template Demonstrates

This template shows how to integrate **Tambo's generative UI** with **Web3 wallet connectivity** on the **Cronos blockchain**. The AI assistant can:

- Display wallet connection status and CRO balance
- Show transaction details with explorer links
- Render token balance cards with price changes
- Provide information about the Cronos network

## Prerequisites

Before you begin, you'll need:

1. **Tambo API Key** - Get one free at [tambo.co/dashboard](https://tambo.co/dashboard)
2. **WalletConnect Project ID** - Get one free at [cloud.walletconnect.com](https://cloud.walletconnect.com)
3. **MetaMask or Web3 wallet** with Cronos network configured

## Setup Instructions

1. **Clone and navigate to the template:**
   ```bash
   cd community/templates/tambo-cronos-web3-starter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp example.env.local .env.local
   ```

4. **Add your API keys to `.env.local`:**
   ```env
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## What's Included

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **Tambo** | AI-powered generative UI components |
| **Wagmi v2** | Ethereum/EVM wallet connections |
| **Viem** | TypeScript Ethereum library |
| **TanStack Query** | Async state management for wallet data |
| **Tailwind CSS** | Utility-first styling |

## Tambo Components

This template registers three AI-controlled components:

### WalletCard
Displays connected wallet info, CRO balance, and network status.

```tsx
// AI can render this when user asks about their wallet
<WalletCard showNetwork={true} variant="detailed" />
```

### TransactionCard
Shows transaction details with status, addresses, and explorer link.

```tsx
// AI renders this when showing transaction info
<TransactionCard
  hash="0x..."
  from="0x..."
  to="0x..."
  value="10.5"
  status="confirmed"
/>
```

### TokenBalance
Displays token holdings with USD value estimation.

```tsx
// AI uses this for token balance queries
<TokenBalance
  symbol="CRO"
  balance="1000.50"
  usdValue="80.04"
  change24h={2.5}
/>
```

## Project Structure

```
tambo-cronos-web3-starter/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Main chat interface page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── tambo/          # Tambo AI components
│   │   │   ├── WalletCard.tsx
│   │   │   ├── TransactionCard.tsx
│   │   │   └── TokenBalance.tsx
│   │   ├── ui/             # UI components
│   │   │   ├── ConnectButton.tsx
│   │   │   └── ChatInterface.tsx
│   │   └── Providers.tsx   # Wagmi + Tambo providers
│   ├── config/
│   │   └── wagmi.ts        # Wagmi config for Cronos
│   └── lib/
│       └── tambo.ts        # Tambo component/tool registry
├── package.json
├── tailwind.config.ts
└── README.md
```

## Customization

### Add More Tambo Components

Edit `src/lib/tambo.ts` to register additional components:

```tsx
export const components: TamboComponent[] = [
  // ... existing components
  {
    name: "YourComponent",
    description: "Description for AI to understand when to use it",
    component: YourComponent,
    propsSchema: z.object({
      // Define props with Zod
    }),
  },
];
```

### Add More Chains

Edit `src/config/wagmi.ts` to add more EVM chains:

```tsx
import { cronos, cronosTestnet, mainnet } from "wagmi/chains";

export const config = createConfig({
  chains: [cronos, cronosTestnet, mainnet],
  // ...
});
```

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Cronos Documentation](https://docs.cronos.org)
- [Wagmi Documentation](https://wagmi.sh)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
