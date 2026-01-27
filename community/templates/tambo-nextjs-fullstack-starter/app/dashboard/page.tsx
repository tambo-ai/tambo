"use client";

import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";

export default function DashboardPage() {
  return (
    <div>
      <h1>Here would be the Dashboard</h1>
      <div>
        <h1>Dashboard</h1>
        <MessageThreadCollapsible
          defaultOpen={false}
          className="absolute bottom-6 right-4"
        />
      </div>
    </div>
  );
}
