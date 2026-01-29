import { z } from "zod";
import { Mail, Building, MessageSquare, User as UserIcon } from "lucide-react";

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
    active: { color: "bg-emerald-500", text: "Active", textColor: "text-emerald-600" },
    away: { color: "bg-amber-500", text: "Away", textColor: "text-amber-600" },
    offline: { color: "bg-gray-400", text: "Offline", textColor: "text-gray-500" },
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
    <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="relative h-20 bg-[#7FFFC3]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full translate-x-1/3 -translate-y-1/3" />
        </div>
      </div>

      {/* Avatar section */}
      <div className="relative px-5">
        <div className="absolute -top-10">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-20 w-20 rounded-xl border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-4 border-white bg-gray-900 shadow-md">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${currentStatus.color} ring-2 ring-white`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-14">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${currentStatus.textColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.color}`} />
            {currentStatus.text}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{role}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{email}</span>
          </div>

          {company && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{company}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <UserIcon className="h-4 w-4" />
            Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
