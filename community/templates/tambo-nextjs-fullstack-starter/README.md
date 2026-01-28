![Template Preview](./public/template-preview.png)

# Tambo Next.js Full-Stack Starter

A production-ready Next.js template with Tambo AI, Google OAuth, and PostgreSQL. Built with modern tools and best practices to help you ship faster.

## Live Demo

[tambo-nextjs-starter-template.vercel.app](tambo-nextjs-starter-template.vercel.app)

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [Example `.env.local` File](#example-envlocal-file)
- [Project Structure](#project-structure)
- [Authentication Setup](#authentication-setup)
  - [User Session Context](#user-session-context)
  - [How It Works](#how-it-works)
- [Theme System](#theme-system)
  - [Landing Page Theme (Green)](#landing-page-theme-green)
  - [Dashboard Theme (Neutral)](#dashboard-theme-neutral)
  - [Customizing Themes](#customizing-themes)
- [AI Chat Interface](#ai-chat-interface)
  - [MessageThreadCollapsible Component](#messagethreadcollapsible-component)
- [Dashboard](#dashboard)
  - [Features](#features-1)
  - [Customizing the Dashboard](#customizing-the-dashboard)
- [Customization Guide](#customization-guide)
  - [Must Change](#must-change)
  - [Should Change](#should-change)
  - [Optional](#optional)
- [Tech Stack](#tech-stack)
- [Key Features Explained](#key-features-explained)
  - [User Context in AI Messages](#user-context-in-ai-messages)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Theme Customization](#theme-customization)
  - [Tambo Components and Tools](#tambo-components-and-tools)
- [Scripts](#scripts)
- [Deployment](#deployment)
  - [Deploy on Vercel](#deploy-on-vercel)
  - [Other Platforms](#other-platforms)
- [Troubleshooting](#troubleshooting)
  - [Components appear transparent/styled incorrectly](#components-appear-transparentstyled-incorrectly)
  - [AI doesn't know user's name](#ai-doesnt-know-users-name)
  - [Chat interface not appearing](#chat-interface-not-appearing)
  - [Database connection issues](#database-connection-issues)
- [Learn More](#learn-more)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- **Next.js 16** - Latest App Router with TypeScript
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Tambo AI** - Integrated AI capabilities with user context
- **Google OAuth** - Authentication ready to go with session management
- **PostgreSQL** - Production-ready database setup
- **Prisma** - Type-safe database ORM

- **Developer-Friendly Dashboard** - Clean, minimal UI optimized for productivity
- **Compact AI Chat Interface** - Fixed bottom chat with keyboard shortcuts
- **Responsive Design** - Mobile-first approach
- **Optimized** - Fast performance out of the box

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun package manager
- PostgreSQL database (for production)
- Tambo AI API key ([Get one here](https://tambo.co))
- Google OAuth credentials ([Setup guide](https://developers.google.com/identity/protocols/oauth2))

### Installation

1. Clone the template:

```bash
git clone <repository-url>
cd tambo-nextjs-fullstack-starter
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the required environment variables (see [Environment Variables](#environment-variables) section below).

4. Run database migrations (if using PostgreSQL):

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Start

1. Sign in with Google OAuth on the landing page
2. Access the dashboard at `/dashboard` after authentication
3. Use the AI chat interface:
   - Press `Ctrl+I` (Windows/Linux) or `Cmd+I` (Mac) to open
   - Type your question and press `Enter`
   - Press `Escape` to close
4. Test user context by asking "what's my name?" - the AI will respond with your name from the session

## Environment Variables

The following environment variables are required or optional for the template to function properly.

### Required Variables

| Variable                           | Description                               | Example                                    |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_TAMBO_API_KEY`        | Your Tambo AI API key                     | `tambo_...`                                |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`     | Google OAuth Client ID                    | `123456789-abc.apps.googleusercontent.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                | `GOCSPX-...`                               |
| `AUTH_SECRET`                      | Secret for NextAuth.js session encryption | Generate with: `openssl rand -base64 32`   |

### Optional Variables

| Variable              | Description                  | Default                            |
| --------------------- | ---------------------------- | ---------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | Not required if not using database |
| `NEXT_PUBLIC_APP_URL` | Base URL for the application | `http://localhost:3000`            |

### Example `.env.local` File

```env
# Tambo AI Configuration
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_auth_secret_here

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Application URL (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
tambo-nextjs-fullstack-starter/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing page (green theme)
│   ├── dashboard/                   # Dashboard routes
│   │   ├── layout.tsx               # Dashboard layout (neutral theme)
│   │   └── page.tsx                 # Dashboard page
│   ├── api/                         # API routes
│   │   └── auth/                    # NextAuth API routes
│   └── globals.css                  # Global styles
├── components/                       # React components
│   ├── tambo/                       # Tambo AI components
│   │   ├── message-thread-collapsible.tsx  # Main chat interface
│   │   ├── thread-dropdown.tsx      # Thread management
│   │   └── ...                      # Other Tambo components
│   ├── tamboAuthentication/         # Auth components
│   │   └── client-layout.tsx        # TamboProvider with user context
│   └── ui/                          # shadcn/ui components
├── lib/                             # Utility functions
│   ├── fonts.ts                     # Font configuration
│   ├── prisma.ts                    # Prisma client instance
│   ├── tambo.ts                     # Tambo components and tools registration
│   └── utils.ts                     # Helper utilities
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma                # Prisma schema definition
│   └── migrations/                  # Database migrations
├── public/                          # Static assets
│   ├── assets/                     # Images, videos, etc.
│   └── logo/                       # Logo files
├── styles/                          # Additional stylesheets
│   └── components-theme.css        # Theme definitions
├── auth.ts                          # NextAuth configuration
├── next.config.ts                   # Next.js configuration
└── package.json                    # Dependencies
```

## Authentication Setup

This template includes Google OAuth authentication with automatic user session management.

### User Session Context

The template automatically passes user information to Tambo AI through context helpers. When a user is logged in, the AI has access to:

- User's name
- User's email
- User's profile image

This is configured in `components/tamboAuthentication/client-layout.tsx`:

```tsx
<TamboProvider
  userToken={userToken}
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  contextHelpers={{
    user: async () => {
      if (!session?.user) return null;
      return {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
    },
  }}
>
```

### How It Works

1. User signs in with Google OAuth
2. Session is stored via NextAuth
3. User information is automatically included in every AI message
4. AI can access user details like name, email, etc.

## Theme System

The template uses a dual-theme system:

### Landing Page Theme (Green)

- Applied via `components-theme` class on `app/page.tsx`
- Green background (`--background: 150 30% 96%`)
- Used for marketing/landing pages

### Dashboard Theme (Neutral)

- Applied via `components-theme dashboard-theme` classes on `app/dashboard/layout.tsx`
- White/neutral background
- Used for authenticated app pages

### Customizing Themes

Edit `styles/components-theme.css` to customize:

- **`.components-theme`** - Landing page theme (green)
- **`.components-theme.dashboard-theme`** - Dashboard theme (neutral)

## AI Chat Interface

The template includes a compact, developer-friendly AI chat interface.

### MessageThreadCollapsible Component

Located at the bottom center of the screen (moves to right when opened).

**Features:**

- **Compact Design** - Small footprint when closed (360px width)
- **Fixed Position** - Always accessible at bottom of screen
- **Hover Effect** - Slightly expands on hover
- **Keyboard Shortcuts:**
  - `Ctrl+I` / `Cmd+I` - Toggle open/closed
  - `Escape` - Close when open
- **Auto-navigation** - Moves to right side when opened
- **Transparent Styling** - Blends with background

**Usage:**

```tsx
import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";

<MessageThreadCollapsible
  defaultOpen={false}
  className="fixed bottom-6 right-4 z-50"
/>;
```

**Customization:**

The component can be customized in `components/tambo/message-thread-collapsible.tsx`:

- Width (closed/open states)
- Position
- Styling and colors
- Keyboard shortcuts

## Dashboard

The dashboard provides a clean, minimal interface optimized for developers.

### Features

- **Minimal UI** - Clean, distraction-free design
- **User Welcome** - Personalized greeting with user's name
- **Quick Start Guide** - Helpful tips for getting started
- **AI Chat Access** - Easy access to Tambo AI assistant

### Customizing the Dashboard

Edit `app/dashboard/page.tsx` to customize:

- Welcome message
- Content sections
- Layout and styling

## Customization Guide

After cloning, you'll want to personalize the template. Here are the key files to update:

### Must Change

- **`app/layout.tsx`** - Update metadata (title & description)
- **`app/page.tsx`** - Customize hero content, buttons, and feature list
- **`package.json`** - Change name, version, and description
- **`README.md`** - Replace with your project documentation
- **`public/logo/wordmark/Tambo-Lockup.svg`** - Replace with your logo
- **`.env.local`** - Add your API keys and secrets

### Should Change

- **`styles/components-theme.css`** - Customize color scheme (primary, secondary, background, etc.)
- **`app/dashboard/page.tsx`** - Customize dashboard content
- **`app/favicon.ico`** - Replace with your favicon
- **`public/assets/landing/hero/`** - Replace hero animation assets or remove if not needed

### Optional

- **`components/tambo/message-thread-collapsible.tsx`** - Customize chat interface
- **`components/tamboAuthentication/client-layout.tsx`** - Add more context helpers
- **`lib/fonts.ts`** - Update custom fonts
- **`components.json`** - Adjust shadcn/ui configuration
- **`next.config.ts`** - Add Next.js-specific configs
- **`tsconfig.json`** - TypeScript configuration adjustments

**Note:** The landing page includes a visual guide showing all files that need customization. Check it out at `http://localhost:3000` after running the dev server.

## Tech Stack

- **Framework:** [Next.js 16.1.5](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Fonts:** Geist Sans/Mono (Google Fonts) + Sentient Light (Custom)
- **AI:** [Tambo AI](https://docs.tambo.co) - Integrated AI with context helpers
- **Auth:** [NextAuth.js](https://next-auth.js.org/) - Google OAuth authentication
- **Database:** [Prisma](https://www.prisma.io/) - Type-safe database ORM
- **Database:** [PostgreSQL](https://www.postgresql.org/) - Production-ready database

## Key Features Explained

### User Context in AI Messages

The template automatically includes user session information in every AI message. This means when users ask "what's my name?", the AI can respond with their actual name from the session.

**How to add more context:**

Edit `components/tamboAuthentication/client-layout.tsx` and add more context helpers:

```tsx
contextHelpers={{
  user: async () => ({ /* user info */ }),
  customData: async () => ({ /* your custom data */ }),
}}
```

### Keyboard Shortcuts

- **`Ctrl+I` / `Cmd+I`** - Toggle AI chat interface
- **`Escape`** - Close AI chat when open
- **`Alt+Shift+N`** - Create new thread (when chat is open)

### Theme Customization

The template uses CSS custom properties for theming. Key files:

- **`styles/components-theme.css`** - Theme definitions
- **`app/globals.css`** - Base theme variables
- **`app/page.tsx`** - Landing page (uses `components-theme` class)
- **`app/dashboard/layout.tsx`** - Dashboard (uses `components-theme dashboard-theme` classes)

### Tambo Components and Tools

The template includes registered Tambo components and tools in `lib/tambo.ts`:

- **BarChart** - Component for displaying user statistics
- **AddUserForm** - Component for adding users to the database
- **getUsersData** - Tool for fetching user summary data

You can extend this by adding more components and tools to the respective arrays in `lib/tambo.ts`.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

### Other Platforms

This template works with any platform that supports Next.js:

- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)

## Troubleshooting

### Components appear transparent/styled incorrectly

- Make sure `components-theme` class is applied to the layout
- Dashboard should use both `components-theme` and `dashboard-theme` classes
- Check that `styles/components-theme.css` is imported in `app/globals.css`

### AI doesn't know user's name

- Verify user session is working (check NextAuth setup)
- Ensure `contextHelpers` are configured in `components/tamboAuthentication/client-layout.tsx`
- Check that user is logged in and session is available

### Chat interface not appearing

- Verify `MessageThreadCollapsible` is added to your page
- Check that `TamboProvider` is wrapping your app in the root layout
- Ensure `NEXT_PUBLIC_TAMBO_API_KEY` is set correctly

### Database connection issues

- Verify `DATABASE_URL` is correctly formatted
- Ensure PostgreSQL is running and accessible
- Run `npx prisma migrate dev` to set up the database schema
- Check Prisma client is properly initialized in `lib/prisma.ts`

## Learn More

- **Tambo Documentation:** [https://docs.tambo.co](https://docs.tambo.co)
- **Tambo Context Helpers:** [https://docs.tambo.co/guides/give-context/make-ai-aware-of-state](https://docs.tambo.co/guides/give-context/make-ai-aware-of-state)
- **Next.js Documentation:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **NextAuth.js:** [https://next-auth.js.org/](https://next-auth.js.org/)
- **shadcn/ui Components:** [https://ui.shadcn.com](https://ui.shadcn.com)
- **Tailwind CSS Docs:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Prisma Documentation:** [https://www.prisma.io/docs](https://www.prisma.io/docs)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This template is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
