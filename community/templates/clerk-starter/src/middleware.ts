import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Middleware - Clerk Authentication Integration
 *
 * This middleware ensures that:
 * 1. Public routes (/, /sign-in, /sign-up) are accessible without authentication
 * 2. Protected routes (like /chat) require Clerk authentication
 * 3. The authenticated session is available to server components via auth()
 *
 * How Clerk → Tambo Auth Works:
 * - clerkMiddleware() establishes the Clerk session on every request
 * - In layout.tsx, we call auth().getToken() to extract the Clerk JWT
 * - This JWT is passed to TamboProvider as userToken
 * - Tambo exchanges the Clerk JWT for a Tambo session token internally
 * - All AI messages are then authenticated with the user's identity
 *
 * This ensures AI-rendered components are scoped to the signed-in user.
 */
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  // This ensures auth() is available in server components for protected routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next|.*\\..*).*)",
  ],
};
