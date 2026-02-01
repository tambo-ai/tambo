import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

/**
 * Landing page - Simple, centered layout.
 *
 * Matches official tambo-template aesthetics:
 * - Minimal text
 * - Simple button styling
 * - No decorative elements
 */
export default async function Home() {
  const user = await currentUser();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Clerk + Tambo
        </h1>

        <SignedOut>
          <div className="flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 border border-border text-foreground rounded text-sm font-medium hover:bg-muted transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <p className="text-sm text-muted-foreground">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            <Link
              href="/chat"
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Go to Chat
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
