"use client";

import type { User } from "@supabase/supabase-js";

interface UserAvatarProps {
  user: User | null;
}

export function UserAvatar({ user }: UserAvatarProps) {
  if (!user) return null;

  const displayName =
    user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <div className="flex items-center min-w-0 sm:gap-2 sm:px-3 sm:py-2 sm:rounded-lg sm:bg-slate-50 sm:border sm:border-slate-200">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
        {displayName.charAt(0).toUpperCase()}
      </div>
      {/* Hide name/email on mobile, show on sm+ */}
      <div className="hidden sm:flex flex-col min-w-0">
        <span className="text-sm font-medium text-slate-900 truncate">
          {displayName}
        </span>
        <span className="text-xs text-slate-500 truncate">{user.email}</span>
      </div>
    </div>
  );
}
