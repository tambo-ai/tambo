"use client";

import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Minimal Welcome */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Start building with Tambo AI</p>
        </div>

        {/* Simple Getting Started */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Click the chat button to start a conversation with Tambo AI.</p>
          <p className="text-xs">
            Customize this page in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              app/dashboard/page.tsx
            </code>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Minimal Welcome */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Start building with Tambo AI</p>
        </div>

        {/* Simple Getting Started */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Click the chat button to start a conversation with Tambo AI.</p>
          <p className="text-xs">
            Customize this page in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              app/dashboard/page.tsx
            </code>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Minimal Welcome */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Start building with Tambo AI</p>
        </div>

        {/* Simple Getting Started */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Click the chat button to start a conversation with Tambo AI.</p>
          <p className="text-xs">
            Customize this page in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              app/dashboard/page.tsx
            </code>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Minimal Welcome */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Start building with Tambo AI</p>
        </div>

        {/* Simple Getting Started */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Click the chat button to start a conversation with Tambo AI.</p>
          <p className="text-xs">
            Customize this page in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              app/dashboard/page.tsx
            </code>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Minimal Welcome */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Start building with Tambo AI</p>
        </div>

        {/* Simple Getting Started */}
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Click the chat button to start a conversation with Tambo AI.</p>
          <p className="text-xs">
            Customize this page in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              app/dashboard/page.tsx
            </code>
          </p>
        </div>
      </div>

      {/* Message Thread Collapsible - Fixed position */}
      <MessageThreadCollapsible
        defaultOpen={false}
        className="fixed bottom-6 right-4 z-50"
      />
    </div>
  );
}
