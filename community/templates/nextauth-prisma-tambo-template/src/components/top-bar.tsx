"use client";

import { LogOut, Plus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface TopBarProps {
  onNewTicket: () => void;
  onToggleChat: () => void;
}

export function TopBar({ onNewTicket, onToggleChat }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-2xl font-bold">Tambo Tickets </h1>

        <div className="flex items-center gap-3">
          <Button onClick={onNewTicket} className="gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>

          <Button onClick={onToggleChat} variant="secondary" className="gap-2">
            ask tambo
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 font-mono text-[10px] font-medium text-primary opacity-100">
              Ctrl K
            </kbd>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt={session?.user?.name || ""}
                  />
                  <AvatarFallback className="bg-transparent" />
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
