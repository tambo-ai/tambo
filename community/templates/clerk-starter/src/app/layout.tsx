import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clerk + Tambo Starter",
  description:
    "First-class starter template demonstrating Clerk authentication integrated with Tambo's runtime-driven UI",
};

/**
 * RootLayout - Server Component
 *
 * 🔐 CLERK → TAMBO AUTHENTICATION INTEGRATION
 *
 * This is where Clerk authentication is wired into Tambo's runtime.
 * The flow is:
 *
 * 1. clerkMiddleware() (in middleware.ts) establishes the Clerk session
 * 2. auth() extracts the authenticated user's JWT token on the server
 * 3. This Clerk JWT is passed to TamboProvider as `userToken`
 * 4. Tambo exchanges the Clerk JWT for a Tambo session token internally
 * 5. All AI messages and component renders are authenticated with the user's identity
 *
 * Critical Points:
 * - auth() MUST be called in a server component (this layout)
 * - The JWT token is extracted server-side for security
 * - When userToken is provided, Tambo operates in authenticated mode
 * - When userToken is undefined, Tambo operates in anonymous mode
 *
 * This ensures:
 * ✅ Clerk manages the authentication lifecycle (sign-in, sign-out, session refresh)
 * ✅ Tambo knows WHO is making AI requests (authenticated by Clerk)
 * ✅ AI-rendered components are scoped to the signed-in user
 * ✅ Messages are associated with the authenticated user
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Extract Clerk authentication on the server
  // This is the critical step that wires Clerk into Tambo
  const { getToken, userId } = await auth();
  const user = await currentUser();

  // Get the Clerk session JWT token
  // This token will be passed to TamboProvider and exchanged for a Tambo session token
  // When this is undefined (user not signed in), Tambo operates in anonymous mode
  const clerkJwt = await getToken();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientLayout
          // Pass the Clerk JWT to TamboProvider
          // This is the bridge that connects Clerk auth to Tambo identity
          userToken={clerkJwt ?? undefined}
          clerkUserId={userId ?? undefined}
          clerkUserEmail={user?.emailAddresses[0]?.emailAddress}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
