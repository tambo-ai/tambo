# Backend — Hono Server

Hono 4 backend with BetterAuth, Drizzle ORM, and PostgreSQL database.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended for free tier)

### 1. Environment Setup

Create `server-hono/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=your-long-random-secret-here
```

**Get Neon for free:**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 2. Install & Setup

```bash
cd server-hono
npm install
npx drizzle-kit push    # Apply database schema
npm run dev
```

Server runs at http://localhost:8787

## Project Structure

```
src/
├── index.ts              # Hono app & routes
├── lib/
│   └── auth.ts          # BetterAuth configuration
├── db/
│   ├── db.ts            # Database connection
│   └── schema.ts        # Drizzle tables (users, products, cart)
└── middleware/          # CORS, auth middleware
```

## Database Schema

The template includes three main tables:

### Users (BetterAuth)
```typescript
user {
  id: primary key
  email: unique
  name: nullable
  image: nullable
  emailVerified: boolean
  createdAt: timestamp
}
```

### Products
```typescript
product {
  id: primary key
  name: string
  description: nullable
  price: numeric
  image: nullable
}
```

### Cart Items
```typescript
cartItem {
  id: primary key
  userId: foreign key → user
  productId: foreign key → product
  quantity: integer
  addedAt: timestamp
}
```

## BetterAuth Configuration

Configured in `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
  database: neonHTTP(env.DATABASE_URL),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    twoFactor(),
    passkey(),
  ],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
})
```

### Add OAuth (Optional)

1. **Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials (Web application)
   - Add http://localhost:8787/callback/google
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **GitHub OAuth:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new OAuth App
   - Authorization callback: http://localhost:8787/callback/github
   - Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

## API Endpoints

### Authentication
```
POST   /api/auth/sign-in/email      # Sign in with email
POST   /api/auth/sign-up/email      # Create new account
POST   /api/auth/sign-out           # Logout
POST   /api/auth/sign-in/oauth      # OAuth signin
GET    /api/auth/session            # Get current session
```

### Data
```
GET    /api/products                # Get all products
GET    /api/cart                    # Get user's cart
POST   /api/cart                    # Add to cart
DELETE /api/cart/:itemId            # Remove from cart
```

## Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run deploy          # Deploy to Cloudflare Workers

# Database
npx drizzle-kit push    # Apply schema changes
npx drizzle-kit studio  # Open Drizzle Studio
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `DATABASE_URL is not a valid URL` | Remove prefix like `psql '` and strip unsupported params like `&channel_binding=require` |
| `BETTER_AUTH_SECRET` error | Ensure the secret is a long random string (40+ characters) |
| Database connection fails | Check `DATABASE_URL` is correct and database is running |
| CORS errors | Check frontend URL is allowed in CORS middleware |
| Port 8787 already in use | Change port in `wrangler.jsonc` or kill existing process |

## Development Tips

- Use `npx drizzle-kit studio` to view/manage database data with GUI
- BetterAuth generates standard auth endpoints automatically
- CORS is configured for `http://localhost:3000` by default
- TypeScript strict mode enabled for type safety
- All routes require valid Hono middleware

## Production Deployment

This template is ready for Cloudflare Workers:

```bash
npm run deploy
```

**Environment variables for production:**
```env
DATABASE_URL=postgresql://...      # Production Neon database
BETTER_AUTH_SECRET=...             # Keep secure with Wrangler secrets
BETTER_AUTH_URL=https://yourapp.com
```

See [Wrangler docs](https://developers.cloudflare.com/workers/wrangler/) for detailed deployment instructions.
