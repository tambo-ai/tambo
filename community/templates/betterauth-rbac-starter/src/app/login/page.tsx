"use client";

import { ErrorPopup } from "@/components/tambo/ErrorPopup";
import { signIn, signUp } from "@/lib/auth-client";
import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await signUp.email({
          email,
          password,
          name,
          initRole: isAdmin ? "admin" : "user",
        });
        if (error) throw error;
      } else {
        const { error } = await signIn.email({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans text-white selection:bg-indigo-500/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950 pointer-events-none" />

      <div className="w-full max-w-[380px] relative z-10 px-6">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-6 rounded-xl bg-gradient-to-tr from-white to-zinc-400 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Image
              src="/assets/octo-white-background-rounded.png"
              alt="Tambo Logo"
              width={40}
              height={40}
              className="object-cover rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {isSignUp ? "Initialize Protocol" : "Welcome back"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isSignUp
              ? "Create a secure identity to continue."
              : "Enter your credentials to access the console."}
          </p>
        </div>

        {/* Glass Card Form */}
        <div className="space-y-4">
          {isSignUp && (
            <div className="group">
              <input
                type="text"
                placeholder="Entity Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}
          <div className="group">
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
            />
          </div>
          <div className="group">
            <input
              type="password"
              placeholder="Access Token (Password)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          {isSignUp && (
            <label className="flex items-center gap-3 py-1 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded border border-zinc-700 checked:bg-indigo-500 checked:border-indigo-500 transition-all"
                />
                <svg
                  className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Grant Administrative Privileges
              </span>
            </label>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-sm"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isSignUp ? "Create Identity" : "Authenticate"}
                <ArrowRight size={14} className="opacity-50" />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-medium">
            <span className="bg-zinc-950 px-3 text-zinc-600">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Button */}
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
              });
            }}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <button
            onClick={async () => {
              await signIn.social({
                provider: "github",
                callbackURL: "/dashboard",
              });
            }}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Footer Toggle */}
        <div className="text-center mt-8">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </div>
  );
}
