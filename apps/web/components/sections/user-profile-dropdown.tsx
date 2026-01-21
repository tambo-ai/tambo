"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/lib/config";
import { track } from "@vercel/analytics";
import { BookOpen, Bug, Calendar, LogOut, MessageSquare } from "lucide-react";
import { useSignOut } from "@/hooks/nextauth";

interface UserProfileDropdownProps {
  user:
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | null
    | undefined;
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const { toast } = useToast();
  const signOut = useSignOut();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      track("User Logout");
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  const userInitial = user.email?.charAt(0).toUpperCase() || "U";
  const displayName = user.name || user.email?.split("@")[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user.image || undefined}
            alt={user.email || "User"}
          />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              Hi, {displayName}
            </p>
            <p className="text-xs leading-none font-normal text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a
            href={siteConfig.links.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Docs
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={siteConfig.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Discord
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`${siteConfig.links.github}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <Bug className="mr-2 h-4 w-4" />
            Create Issue
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`mailto:${siteConfig.links.email}?subject=Meeting Request`}
            className="flex items-center cursor-pointer"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Meet with Founder
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
