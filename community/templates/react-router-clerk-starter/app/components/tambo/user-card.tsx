"use client";

import { useUser, SignInButton, SignOutButton } from "@clerk/react-router";
import { LogOut, User } from "lucide-react";

import { useThreadHistoryContext } from "~/components/tambo/thread-history";

export function UserCard({ className }: { className?: string }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { isCollapsed } = useThreadHistoryContext();

    if (!isLoaded) {
        if (isCollapsed) {
            return (
                <div className={`p-2 border-t border-border bg-muted/50 flex justify-center ${className}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                </div>
            );
        }
        return (
            <div className={`p-4 border-t border-border bg-muted/50 ${className}`}>
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-2 w-32 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }
    if (!isSignedIn) {
        if (isCollapsed) {
            return (
                <></>
            );
        }
        return (
            <div className={`p-4 border-t border-border bg-muted/50 ${className}`}>
                <SignInButton mode="modal">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                        <User className="w-4 h-4" />
                        Sign In
                    </button>
                </SignInButton>
            </div>
        );
    }

    if (isCollapsed) {
        return (
            <div className={`p-2 border-t border-border bg-muted/50 flex flex-col items-center gap-2 ${className}`}>
                <SignOutButton>
                    <button
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </SignOutButton>
            </div>
        );
    }

    return (
        <div className={`p-4 border-t border-border bg-muted/50 ${className}`}>
            <div className="flex items-center gap-3">
                <img
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    className="w-8 h-8 rounded-full border border-border"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                        {user.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {user.primaryEmailAddress?.emailAddress}
                    </p>
                </div>
                <SignOutButton>
                    <button
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </SignOutButton>
            </div>
        </div>
    );
}
