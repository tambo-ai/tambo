# BetterAuth + Hono + Tambo Starter

A full-stack template for building AI-powered applications with complete authentication, Hono backend services, and Tambo AI-driven interactions.

## What This Template Demonstrates

Build a complete authentication system with BetterAuth, backend powered by Hono + Drizzle ORM, and Tambo AI for intelligent interactions. Users can interact with products and shopping cart through natural language commands ("add headphones to cart"), demonstrating how custom Tambo tools integrate seamlessly with authenticated backends.

**Screenshots:**


**Video Demo:**


## Prerequisites

- Node.js 18+ and npm
- Tambo API key ([create free account](https://tambo.co))
- PostgreSQL database (Neon recommended - free tier available)
- (Optional) Google & GitHub OAuth app credentials for social login

## Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React frontend |
| **Hono 4** | Backend server |
| **BetterAuth 1.4** | Email, Google, GitHub auth |
| **Drizzle ORM** | Type-safe database |
| **Tambo AI** | AI chat & custom tools |
| **TailwindCSS 4** | Responsive styling |
| **TypeScript** | Full type safety with strict mode |

## Quick Start

### 1. Install Dependencies

```bash
npm install
# Or if npm install doesn't work from root:
cd server-hono && npm install && cd ../client-nextjs && npm install && cd ..
```

### 2. Configure Environment

**Backend** (`server-hono/.env`):
```env
DATABASE_URL=postgresql://user:password@host/dbname
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=generate-a-random-secret-here
```

**Frontend** (`client-nextjs/.env.local`):
```env
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-api-key
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

### 3. Setup Database

```bash
cd server-hono
npx drizzle-kit push
```

### 4. Start Servers

**From root directory:**
```bash
npm run dev
```

This starts both backend (http://localhost:8787) and frontend (http://localhost:3000) concurrently.

Or manually in separate terminals:
```bash
# Terminal 1
cd server-hono && npm run dev

# Terminal 2
cd client-nextjs && npm run dev
```

### 5. Test the Template

1. Open http://localhost:3000
2. Sign in with email or OAuth
3. Navigate to "Interactables" page
4. Try: *"Add headphones to cart"* or *"Show me the cart"*

## Project Structure

```
betterauth-hono-drizzle-starter/
├── server-hono/
│   ├── src/
│   │   ├── index.ts                 # Hono app entry
│   │   ├── db/
│   │   │   ├── db.ts               # Database connection
│   │   │   └── schema.ts           # Tables: users, products, cart
│   │   └── lib/
│   │       └── auth.ts             # BetterAuth configuration
│   ├── drizzle.config.ts           # Drizzle migrations config
│   └── package.json
│
└── client-nextjs/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            # Home with login/logout
    │   │   ├── auth/
    │   │   │   ├── sign-in/        # Sign in page + Suspense wrapper
    │   │   │   └── sign-up/        # Sign up page
    │   │   └── interactables/      # AI shopping demo
    │   ├── components/
    │   │   └── tambo/              # Tambo UI components
    │   ├── lib/
    │   │   ├── tambo.ts            # Tambo tools & components registration
    │   │   ├── shopping-tools.ts   # AI tool definitions (getProducts, addToCart, etc.)
    │   │   ├── shopping-actions.ts # Tool implementation logic
    │   │   ├── shopping-utils.ts   # Cart utilities (localStorage)
    │   │   └── auth-client.ts      # Auth client setup
    │   └── types/
    └── package.json
```

## Features

### ✅ Authentication
- Email/password signup & signin
- Google OAuth login
- GitHub OAuth login  
- Session management with BetterAuth

### ✅ AI-Powered Interactions (Tambo)
- Custom tools: `getProducts`, `addToCart`, `getCart`, `clearCart`
- Tambo components: `ProductStore`, `ShoppingCart`
- Natural language processing by AI
- Proper Suspense boundaries for Next.js

### ✅ Backend
- Hono server with CORS support
- BetterAuth integration
- Drizzle ORM for type safety
- Product & cart item tables
- Ready for Neon or other PostgreSQL

### ✅ Code Quality
- TypeScript strict mode enabled
- ESLint configured
- Build passes type checking
- Clean, modular architecture
- No unused dependencies

## Development Commands

### Backend
```bash
cd server-hono
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Check code quality
npm run lint:fix   # Auto-fix lint issues
```

### Frontend
```bash
cd client-nextjs
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Run production build
npm run lint       # Check code quality
npm run lint:fix   # Auto-fix lint issues
```

## How Tambo Integration Works

### 1. Define Tools

In `client-nextjs/src/lib/shopping-tools.ts`:
```typescript
export const getProductsTool: TamboTool = {
  name: "getProducts",
  description: "Get available products",
  tool: getProductsAction,
  inputSchema: z.object({...}),
  outputSchema: z.object({...})
}
```

### 2. Register Tools & Components

In `client-nextjs/src/lib/tambo.ts`:
```typescript
export const tools = [...shoppingTools]
export const components = [
  {
    name: "ProductStore",
    component: InteractableProductStore,
    propsSchema: {...}
  },
  // ... more components
]
```

### 3. Use in App

The TamboProvider automatically:
- Makes tools available to AI
- Renders components when AI requests them
- Handles state management

### 4. User Interaction

User says: *"add headphones to cart"*
→ AI calls `addToCart` tool
→ Cart updates via localStorage
→ `ShoppingCart` component re-renders

## Customization

### Add Your Own Tambo Tool

1. Create action function in `shopping-actions.ts`
2. Define tool schema in `shopping-tools.ts`
3. Register in `tambo.ts`

Example:
```typescript
export const myTool: TamboTool = {
  name: "myTool",
  description: "What this does",
  tool: myAction,
  inputSchema: z.object({...}),
  outputSchema: z.object({...})
}
```

### Connect to Real Database

1. Update `DATABASE_URL` in `server-hono/.env`
2. Run `npx drizzle-kit push`
3. Remove localStorage fallback from `shopping-utils.ts`
4. Implement user-specific cart queries

### Customize Auth

Edit `server-hono/src/lib/auth.ts` to:
- Add more OAuth providers
- Modify session duration
- Add custom user metadata
- Change email templates

## Production Deployment

### Frontend (Vercel)
```bash
cd client-nextjs
npm run build
# Deploy to Vercel
```

### Backend (Cloudflare Workers)
```bash
cd server-hono
wrangler deploy
```

Or deploy anywhere Node.js/Docker runs.



## What's NOT Included

This template is intentionally minimal:
- ❌ Payment processing
- ❌ Complex admin dashboards
- ❌ Email notifications
- ❌ Multiple styling themes
- ❌ Analytics tracking

These can be added based on your needs. The template stays lean and focused.

## Learning Resources

- [Tambo Documentation](https://tambo.co/docs)
- [BetterAuth Documentation](https://www.betterauth.com)
- [Hono Documentation](https://hono.dev)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [Next.js 15 Docs](https://nextjs.org/docs)

## Next Steps

1. Replace shopping demo with your own tools/components
2. Build your business logic on the backend
3. Customize authentication as needed
4. Deploy to production
5. Add real payment/database features

## License

MIT

---

**Built for creating AI-powered applications with modern authentication and beautiful UX.**
