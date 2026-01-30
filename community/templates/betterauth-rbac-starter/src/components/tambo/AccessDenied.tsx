import { ShieldBan } from "lucide-react";

export function AccessDenied({
  message = "Administrative privileges required.",
}: {
  message?: string;
}) {
  return (
    <div className="w-full max-w-[350px] mx-auto overflow-hidden rounded-xl border border-red-500/30 bg-red-950/10 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-300">
      {/* Glossy sheen effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent opacity-50 pointer-events-none" />

      <div className="relative p-5 flex items-center gap-4">
        <div className="flex-shrink-0 relative">
          {/* Glowing background for icon */}
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
          <ShieldBan className="w-10 h-10 text-red-500 relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-red-500 font-bold text-base tracking-tight mb-0.5">
            Access Restricted
          </h3>
          <p className="text-red-400/80 text-xs font-medium leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Bottom decorative bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-red-500/50 via-red-500/20 to-transparent" />
    </div>
  );
}
