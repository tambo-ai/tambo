"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

export function DatabaseSetup() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const supabase = createClient();
        // Try to query the table - if it doesn't exist, we need setup
        const { error } = await supabase
          .from("user_profiles")
          .select("id")
          .limit(1);

        // If table doesn't exist, error will contain table not found message
        if (error?.message.includes("user_profiles")) {
          setNeedsSetup(true);
        } else {
          // Table exists, hide the setup prompt
          setNeedsSetup(false);
          setIsChecking(false);
        }
      } catch {
        setNeedsSetup(true);
      } finally {
        setIsChecking(false);
      }
    };

    void checkDatabase();

    // Re-check when user returns to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && needsSetup) {
        void checkDatabase();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also periodically check every 5 seconds when setup is needed
    let interval: NodeJS.Timeout | undefined;
    if (needsSetup) {
      interval = setInterval(() => {
        void checkDatabase();
      }, 5000);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (interval) clearInterval(interval);
    };
  }, [needsSetup]);

  if (isChecking || !needsSetup) {
    return null;
  }

  const supabaseProjectId =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0].split("//")[1];

  const SQL = `-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Index and trigger
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op: clipboard not available
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[101] max-w-sm p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-lg">
        <h3 className="font-semibold text-amber-900 mb-2">
          Database Setup Required
        </h3>
        <p className="text-sm text-amber-800 mb-3">
          The user_profiles table hasn't been created yet. Click the button
          below to set it up in Supabase.
        </p>
        <a
          href={`https://supabase.com/dashboard/project/${supabaseProjectId}/sql`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-3 py-2 bg-amber-600 text-white rounded text-center text-sm hover:bg-amber-700 transition mb-3"
        >
          Open Supabase SQL Editor
        </a>
        <p className="text-xs text-amber-700 mb-2 italic">
          After running the SQL, this page will auto-refresh within 5 seconds.
        </p>
        <details className="text-xs text-amber-700">
          <summary className="cursor-pointer font-medium flex items-center gap-2">
            <span>Show SQL to paste</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
              aria-label="Copy SQL"
            >
              <span aria-hidden>📋</span>
              <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
            </button>
          </summary>
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-60 border border-amber-100">
            {SQL}
          </pre>
        </details>
      </div>
    </>
  );
}
