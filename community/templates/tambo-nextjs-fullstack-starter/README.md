![Template Preview](./public/template-preview.png)

# Tambo Next.js Full-Stack Starter

A production-ready Next.js template with Tambo AI, Google OAuth, and PostgreSQL. Get your AI app development started quickly.

## Get Started

1. **Create a new project** (or clone this template):

   ```bash
   npm create tambo-app@latest my-tambo-app
   ```

   Or clone this repo and `cd` into the template folder.

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Tambo and environment variables:**
   - Run `npx tambo init` to configure Tambo and create `.env.local` with your API key, **or**
   - Copy `.env.example` to `.env.local` and add your keys (see [Environment Variables](#environment-variables) below for how to generate each).

   Get a free Tambo API key [here](https://tambo.co/dashboard).

4. **Run database migrations** (if using PostgreSQL):

   ```bash
   npx prisma migrate dev
   ```

5. **Start the app:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then use the dashboard and AI chat (`Ctrl+I` / `Cmd+I` to open).

---

## Environment Variables

Create a `.env.local` file (e.g. by copying `.env.example`) and set these variables. Here’s what each one is and **how to generate or obtain it**:

| Variable                    | Description                           | How to generate / obtain                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_TAMBO_API_KEY` | Tambo AI API key                      | Run `npx tambo init` or get one for free at [tambo.co/dashboard](https://tambo.co/dashboard).                                                                                                                                                                     |
| `GOOGLE_CLIENT_ID`          | Google OAuth 2.0 Client ID            | [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**. Choose “Web application”, add authorized redirect URIs (e.g. `http://localhost:3000/api/auth/callback/google`). |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth 2.0 Client secret        | Same OAuth client as above. Copy the “Client secret” from the client details.                                                                                                                                                                                     |
| `AUTH_SECRET`               | NextAuth.js session encryption secret | Generate a random string: `openssl rand -base64 32` (run in terminal).                                                                                                                                                                                            |
| `AUTH_URL`                  | Your app’s base URL                   | Use your app URL, e.g. `http://localhost:3000` for local dev, or your production URL (e.g. `https://your-app.vercel.app`).                                                                                                                                        |
| `DATABASE_URL`              | PostgreSQL connection string          | **(Optional.)** Create a Postgres DB (e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [Supabase](https://supabase.com), or local). Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.                                                          |

**Example `.env.local`:**

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_generated_secret
AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

---

## Project structure

| Path                                               | Purpose                           |
| -------------------------------------------------- | --------------------------------- |
| `app/layout.tsx`                                   | Root layout, providers            |
| `app/page.tsx`                                     | Landing page                      |
| `app/dashboard/`                                   | Dashboard layout and page         |
| `components/tamboAuthentication/client-layout.tsx` | `TamboProvider`, user context     |
| `components/tambo/message-thread-collapsible.tsx`  | AI chat UI (`Ctrl+I` / `Cmd+I`)   |
| `lib/tambo.ts`                                     | Components and tools registration |
| `auth.ts`                                          | NextAuth (Google OAuth)           |

---

## Customizing

### Change what components Tambo can control

Components are registered in `lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "BarChart",
    description: "A bar chart for user statistics.",
    component: ChartBarLabelCustom,
    propsSchema: chartBarSchema,
  },
  {
    name: "AddUserForm",
    // ...
  },
  // Add more components here
];
```

You can add the example Graph component with:

```bash
npx tambo add graph
```

Update the `components` array with any component(s) you want Tambo to use. More info: [Generative Components](https://docs.tambo.co/concepts/generative-interfaces/generative-components).

### Add tools for Tambo to use

Tools are defined in `lib/tambo.ts` with `inputSchema` and `outputSchema`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "getUsersData",
    description: "Fetches user summary data for the bar chart.",
    tool: getUsersData,
    inputSchema: z.object({}),
    outputSchema: z.object({ data: z.array(...), title: z.string(), ... }),
  },
  // Add more tools here
];
```

More info: [Tools](https://docs.tambo.co/concepts/tools).

### The Magic of Tambo Requires the TamboProvider

Wrap your app (or the relevant part) with `TamboProvider`. In this template it’s in `components/tamboAuthentication/client-layout.tsx`:

```tsx
<TamboProvider
  userToken={userToken}
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
  tools={tools}
  contextHelpers={{
    user: async () =>
      session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }
        : null,
  }}
>
  {children}
</TamboProvider>
```

Use a client component. Pass `components` and `tools`; use `userToken` for auth and `contextHelpers` (e.g. user session) so the AI has user context.

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice` hook for speech-to-text input.

---

## Scripts

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run start` – start production server
- `npm run lint` – run ESLint

---

## Learn more

- [Tambo Documentation](https://docs.tambo.co)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma](https://www.prisma.io/docs)
