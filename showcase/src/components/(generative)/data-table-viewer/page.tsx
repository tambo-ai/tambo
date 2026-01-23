"use client";

import { DataTableViewer } from "@tambo-ai/react";

export default function DataTableViewerDemo() {
  // Creating 10,000 rows of mock data for the stress test
  const mockData = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    role: i % 2 === 0 ? "Admin" : "Editor",
    email: `user${i}@example.com`,
    status: i % 3 === 0 ? "Active" : "Pending",
  }));

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "status", header: "Status" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          DataTableViewer
        </h1>
        <p className="text-muted-foreground">
          High-performance virtualization rendering 10,000 rows with sticky
          headers.
        </p>
      </div>

      <div className="h-[600px] w-full border border-zinc-800 rounded-lg overflow-hidden">
        <DataTableViewer data={mockData} columns={columns} />
      </div>
    </div>
  );
}
