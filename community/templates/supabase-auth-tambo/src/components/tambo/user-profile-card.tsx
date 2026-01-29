"use client";

import { getCurrentUserProfile } from "@/server/actions";
import { useEffect, useState } from "react";

interface ProfileData {
  name: string;
  email: string;
  note: string | null;
  lastUpdated?: string;
}

export function UserProfileCard() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const data = await getCurrentUserProfile();
        if (mounted) {
          setProfile(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
          setIsLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-slate-200 rounded-lg" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 shadow-lg overflow-hidden p-6">
        <p className="text-sm text-red-600">
          {error || "Failed to load profile"}
        </p>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-br from-blue-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate">
              {profile.name}
            </h3>
            <p className="text-sm text-blue-100 truncate">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Note Section */}
      <div className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-blue-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Note
            </p>
          </div>
          {profile.note ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-word">
                {profile.note}
              </p>
              {profile.lastUpdated && (
                <p className="text-xs text-slate-400 mt-2">
                  Updated {new Date(profile.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-200 p-4">
              <p className="text-sm text-slate-400 italic text-center">
                No note saved yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
