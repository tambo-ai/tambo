"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NavbarProps {
  role: "admin" | "user";
  userName: string;
}

export function Navbar({ role, userName }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 h-14">
      <div className="max-w-5xl mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/octo-white-background-rounded.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            tambo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-xs font-medium text-zinc-400">
              {role === "admin" ? "Administrator" : "User"}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-200">
                {userName}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
