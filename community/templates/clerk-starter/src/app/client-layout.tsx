"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { components, tools } from "@/lib/tambo";
import { ClerkProvider } from "@clerk/nextjs";
import { TamboProvider } from "@tambo-ai/react";
import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
  /**
   * Clerk JWT token - passed to Tambo for session authentication.
   * Tambo exchanges this for a Tambo session token internally.
   */
  userToken?: string;
  /**
   * Stable Clerk userId - used to identify the user across sessions.
   * This ensures Tambo knows WHO is making requests.
   */
  clerkUserId?: string;
  /**
   * User's email from Clerk - for display purposes only.
   */
  clerkUserEmail?: string;
}

/**
 * ClientLayout - Client Component
 *
 * 🔐 CLERK → TAMBO AUTHENTICATION BRIDGE
 *
 * This component is the client-side bridge connecting Clerk (app authentication)
 * with Tambo (AI runtime). The architecture is:
 *
 * Provider Hierarchy:
 * 1. ClerkProvider - Manages authentication UI and session state on the client
 * 2. TamboProvider - Receives the authenticated user's JWT token from the server
 *
 * The userToken prop is the critical authentication link:
 * - When provided (user signed in): Tambo AI messages are AUTHENTICATED to this user
 * - When undefined (user signed out): Tambo operates in anonymous mode
 *
 * Authentication Flow:
 * 1. Server (layout.tsx) extracts Clerk JWT via auth().getToken()
 * 2. JWT is passed to this component as userToken prop
 * 3. TamboProvider receives userToken and exchanges it for a Tambo session token
 * 4. All AI interactions (messages, component renders) are authenticated
 *
 * This separation ensures:
 * ✅ Clerk owns the auth lifecycle (sign-in, sign-out, session refresh)
 * ✅ Tambo owns the AI interaction (messages, threads, runtime-driven components)
 * ✅ The JWT token is the secure bridge connecting these two systems
 * ✅ AI-rendered components are scoped to the authenticated user
 */
export default function ClientLayout({
  children,
  userToken,
  clerkUserId,
}: ClientLayoutProps) {
  if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_TAMBO_API_KEY) {
    console.error(
      "❌ Missing NEXT_PUBLIC_TAMBO_API_KEY in environment variables",
    );
  }

  // Authentication State:
  // - userToken present → Tambo exchanges Clerk JWT for Tambo session token
  // - userToken undefined → Tambo operates in anonymous mode
  //
  // When authenticated, Tambo will:
  // 1. Associate all AI messages with the authenticated user
  // 2. Persist conversation history per user
  // 3. Scope AI-rendered components to the signed-in user

  return (
    <ErrorBoundary>
      <ClerkProvider>
        <TamboProvider
          apiKey={(process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? "").trim()}
          // 🔐 AUTHENTICATION: This token maps Clerk auth to Tambo identity
          // Tambo uses this to authenticate AI requests and scope components to the user
          // When undefined, Tambo operates in anonymous mode
          userToken={userToken}
          // Runtime-driven UI: AI emits structured actions that render these components
          components={components}
          tools={tools}
        >
          {children}
        </TamboProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
