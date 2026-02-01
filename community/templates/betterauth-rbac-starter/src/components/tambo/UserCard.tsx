"use client";

import { Shield, Mail, Calendar, Settings, ChevronRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function UserCard() {
  const { data: session } = useSession();

  if (!session)
    return (
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse flex flex-col items-center w-full">
        <div className="w-20 h-20 bg-zinc-800 rounded-full mb-4" />
        <div className="w-32 h-4 bg-zinc-800 rounded mb-2" />
        <div className="w-24 h-3 bg-zinc-800 rounded" />
      </div>
    );

  const userName = session.user.name || "Authenticated User";
  const userRole = session.user.role || "user";
  const userEmail = session.user.email || "No email linked";
  const userId = session.user.id || "unknown-id";
  const userJoined = session.user.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString()
    : "Recently";

  return (
    <div className="group relative w-full max-w-[350px] mx-auto opacity-100 scale-100 transition-all duration-500">
      {/* Holographic Border Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[32px] opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200" />

      <div className="relative p-8 bg-black border border-white/10 rounded-[30px] overflow-hidden">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 text-white">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-3xl font-black">
                {userName[0]?.toUpperCase() || "U"}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors duration-300">
              {userName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  userRole === "admin"
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {userRole}
              </span>
              <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Shield size={10} /> Verified Identity
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow
            icon={<Mail size={14} />}
            label="Protocol"
            value={userEmail}
          />
          <InfoRow
            icon={<Calendar size={14} />}
            label="Enrolled"
            value={userJoined}
          />
          <InfoRow
            icon={<Settings size={14} />}
            label="Entity ID"
            value={userId.slice(0, 16)}
          />
        </div>

        <button className="w-full mt-8 py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
          Access Neural Settings{" "}
          <ChevronRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group/row hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-zinc-500 group-hover/row:text-indigo-400 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover/row:text-zinc-400 transition-colors">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-zinc-300 group-hover/row:text-white transition-colors truncate max-w-[150px]">
        {value}
      </span>
    </div>
  );
}
