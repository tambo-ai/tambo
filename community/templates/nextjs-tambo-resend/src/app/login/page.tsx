"use client";

import { supabase } from "@/lib/superbase/client";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/chat`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank" rel="noopener noreferrer">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo AI Logo"
              width={80}
              height={80}
              className="mb-4"
            />
          </a>

          <h1 className="text-4xl text-center">
            Sign In
          </h1>

          <p className="text-gray-600 text-center mt-2">
            Access your AI Email Assistant
          </p>
        </div>

        <div className="bg-white px-8 py-6 rounded-lg">

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7FFFC3] focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && signIn()}
              />
            </div>

            <button
              onClick={signIn}
              disabled={loading}
              className="w-full px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Sending link..." : "Verify email ->"}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${message.includes("Check") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {message}
              </div>
            )}

            <p className="text-sm text-gray-500 text-center">
              We'll send you a secure link to sign in without a password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
