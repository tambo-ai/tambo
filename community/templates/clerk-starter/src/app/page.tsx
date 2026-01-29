import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-3xl font-semibold">Clerk + Tambo Starter</h1>

        <SignedOut>
          <div className="flex flex-col gap-4">
            <Link
              href="/sign-in"
              className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <p className="text-gray-600">
              Signed in as {user?.emailAddresses[0]?.emailAddress}
            </p>
            <Link
              href="/chat"
              className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-90"
            >
              Go to Chat
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
