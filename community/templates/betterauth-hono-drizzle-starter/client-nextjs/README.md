# Frontend — Next.js Client

Next.js 15 frontend with BetterAuth authentication, Tambo AI integration, and shopping demo.

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### 1. Environment Setup

Create `client-nextjs/.env.local`:
```env
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-api-key
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:8787
```

Get your free Tambo API key at [tambo.co/dashboard](https://tambo.co/dashboard).

### 2. Install & Run

```bash
cd client-nextjs
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Home page with auth
│   ├── auth/
│   │   ├── sign-in/page.tsx         # Sign in page + Suspense wrapper
│   │   └── sign-up/page.tsx         # Sign up page
│   ├── interactables/
│   │   └── page.tsx                 # AI shopping demo
│   └── api/                         # API routes (if needed)
├── components/
│   ├── ApiKeyCheck.tsx              # API key validation
│   ├── preview-panel.tsx            # Chat preview
│   ├── tambo/                       # Tambo-specific components
│   │   ├── InteractableProductStore.tsx
│   │   └── InteractableShoppingCart.tsx
│   └── ui/                          # Reusable UI components
├── lib/
│   ├── tambo.ts                     # Tambo tools & components config
│   ├── auth-client.ts               # BetterAuth client
│   ├── shopping-tools.ts            # AI tool definitions
│   ├── shopping-actions.ts          # Tool implementations
│   ├── shopping-utils.ts            # Cart utilities
│   └── utils.ts                     # Helpers
├── types/
│   └── index.ts                     # Type definitions
└── globals.css                      # Tailwind styles
```

## Key Features

### Authentication
- Email/password with BetterAuth
- Google & GitHub OAuth
- Session management with `useSession()`

```tsx
import { useSession, signIn, signOut } from '@/lib/auth-client'

export default function Page() {
  const session = useSession()
  
  if (!session) {
    return <button onClick={() => signIn()}>Sign In</button>
  }
  
  return <button onClick={() => signOut()}>Sign Out</button>
}
```

### Tambo AI Integration

Register tools and components in `src/lib/tambo.ts`:

```tsx
export const shoppingTools = [
  {
    name: "getProducts",
    description: "Get all available products",
    tool: getProductsAction,
    inputSchema: z.object({}),
    outputSchema: z.array(productSchema),
  },
  // More tools...
]

export const components = [
  {
    name: "ProductStore",
    description: "Display available products",
    component: InteractableProductStore,
    propsSchema: productStorePropsSchema,
  },
  // More components...
]
```

Wrap your app with TamboProvider:
```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  tools={shoppingTools}
  components={components}
>
  {children}
</TamboProvider>
```

### Shopping System

Try in the interactables page:
- "Add headphones to cart"
- "Show me the cart"
- "Remove headphones from cart"
- "Clear the cart"

The shopping system uses:
- `shopping-utils.ts` — localStorage cart management
- `shopping-actions.ts` — Business logic for tools
- `shopping-tools.ts` — Tambo AI tool registration

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend can't reach backend | Check `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_URL` point to running backend (default `http://localhost:8787`) |
| CORS errors | Verify backend CORS allows `http://localhost:3000` |
| Tambo API errors | Confirm `NEXT_PUBLIC_TAMBO_API_KEY` is valid at [tambo.co/dashboard](https://tambo.co/dashboard) |
| Build errors | Run `npm run build` to check for TypeScript errors |

## Commands

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run start       # Run production build
npm run lint        # Check code quality
```

The template includes MCP support for connecting to external tools and resources. You can use the MCP hooks from `@tambo-ai/react/mcp`:

- `useTamboMcpPromptList` - List available prompts from MCP servers
- `useTamboMcpPrompt` - Get a specific prompt
- `useTamboMcpResourceList` - List available resources

See `src/components/tambo/mcp-components.tsx` for example usage.

### Change where component responses are shown

The components used by tambo are shown alongside the message response from tambo within the chat thread, but you can have the result components show wherever you like by accessing the latest thread message's `renderedComponent` field:

```tsx
const { thread } = useTambo();
const latestComponent =
  thread?.messages[thread.messages.length - 1]?.renderedComponent;

return (
  <div>
    {latestComponent && (
      <div className="my-custom-wrapper">{latestComponent}</div>
    )}
  </div>
);
```

For more detailed documentation, visit [Tambo's official docs](https://docs.tambo.co).
