import { z } from "zod";
import { Mail, Building, MessageSquare, Eye } from "lucide-react";

// Schema that tells Tambo AI how to generate this component
export const userCardSchema = z.object({
  name: z.string().describe("The user's full name"),
  email: z.string().email().describe("The user's email address"),
  role: z.string().describe("The user's job role or position"),
  company: z.string().optional().describe("The company the user works for"),
  status: z
    .enum(["active", "away", "offline"])
    .default("active")
    .describe("The user's current status"),
  avatarUrl: z.string().url().optional().describe("URL to the user's avatar image"),
});

type UserCardProps = z.infer<typeof userCardSchema>;

export function UserCard({
  name,
  email,
  role,
  company,
  status = "active",
  avatarUrl,
}: UserCardProps) {
  const statusConfig = {
    active: { color: "bg-emerald-500", glow: "shadow-emerald-500/50", text: "Active", ring: "ring-emerald-500/20" },
    away: { color: "bg-amber-500", glow: "shadow-amber-500/50", text: "Away", ring: "ring-amber-500/20" },
    offline: { color: "bg-slate-400", glow: "shadow-slate-400/50", text: "Offline", ring: "ring-slate-400/20" },
  };

  const currentStatus = statusConfig[status];

  // Generate initials for avatar fallback
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100 card-hover">
      {/* Header with animated gradient */}
      <div className="relative h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
      </div>

      {/* Avatar section */}
      <div className="relative px-6">
        <div className="absolute -top-14 flex items-end gap-4">
          {/* Avatar with status */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-xl"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl">
                <span className="text-3xl font-bold text-white">{initials}</span>
              </div>
            )}
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full ${currentStatus.color} ring-4 ${currentStatus.ring} shadow-lg ${currentStatus.glow}`}>
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>

          {/* Status badge */}
          <div className={`mb-2 flex items-center gap-1.5 rounded-full ${currentStatus.color}/10 px-3 py-1.5 ring-1 ${currentStatus.ring}`}>
            <div className={`h-2 w-2 rounded-full ${currentStatus.color} animate-pulse`} />
            <span className={`text-xs font-semibold ${status === 'active' ? 'text-emerald-600' : status === 'away' ? 'text-amber-600' : 'text-slate-500'}`}>
              {currentStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-20">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{name}</h2>
        <p className="mt-1 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          {role}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-slate-600 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors">
              <Mail className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span className="text-sm font-medium">{email}</span>
          </div>

          {company && (
            <div className="flex items-center gap-3 text-slate-600 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-purple-100 transition-colors">
                <Building className="h-4 w-4 text-slate-500 group-hover:text-purple-600 transition-colors" />
              </div>
              <span className="text-sm font-medium">{company}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
            <Eye className="h-4 w-4" />
            Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
