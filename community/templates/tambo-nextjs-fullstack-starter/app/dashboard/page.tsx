"use client";

import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";
import { SpinnerCustom } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  ChevronRight,
  Code,
  Database,
  FileCode,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  authorId: number;
}

interface User {
  id: number;
  email: string;
  name: string | null;
  posts: Post[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/getUser");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const allPosts = users.flatMap((user) =>
    user.posts.map((post) => ({
      ...post,
      authorName: user.name || user.email,
    })),
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">User and Post Data</p>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <SpinnerCustom />
          </div>
        )}

        {error && (
          <div className="text-center text-destructive py-8">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Tables Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users Table - Left Side */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Users ({users.length})
                </h2>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Posts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.name || "N/A"}</TableCell>
                          <TableCell className="truncate max-w-[200px]">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-center">
                            {user.posts.length}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="font-semibold">
                          Total Users
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {users.length}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Posts Table - Right Side */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Posts ({allPosts.length})
                </h2>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>{post.id}</TableCell>
                          <TableCell className="font-medium max-w-[150px] truncate">
                            {post.title}
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate"
                            title={post.content || ""}
                          >
                            {post.content || "N/A"}
                          </TableCell>
                          <TableCell className="truncate max-w-[120px]">
                            {post.authorName}
                          </TableCell>
                          <TableCell className="text-center">
                            {post.published ? (
                              <span className="text-green-600 text-xs">
                                Yes
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                No
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-semibold">
                          Total Posts
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {allPosts.length}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>

            {/* Template Guide - Below Tables */}
            <div className="mt-12">
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Template Guide</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quick reference for customizing this template
                  </p>
                </div>

                {/* Getting Started */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Getting Started
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Set up your database connection in{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          .env
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Run migrations:{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          npx prisma migrate dev
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Seed data via{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          POST /api/addUser
                        </code>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Files to Edit */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Files to Edit
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs">app/dashboard/page.tsx</code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Customize dashboard layout, add new sections, or modify
                        table displays
                      </p>
                    </li>
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs">
                          app/api/getUser/route.ts
                        </code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Modify data fetching logic, add filters, or change
                        response format
                      </p>
                    </li>
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs">
                          app/api/addUser/route.ts
                        </code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Customize data seeding, add validation, or change data
                        structure
                      </p>
                    </li>
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs">prisma/schema.prisma</code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Define your database models and relationships
                      </p>
                    </li>
                  </ul>
                </div>

                {/* Database */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Operations
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          npx prisma studio
                        </code>{" "}
                        - View/edit data
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          npx prisma generate
                        </code>{" "}
                        - Regenerate client
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          npx prisma migrate
                        </code>{" "}
                        - Apply schema changes
                      </span>
                    </li>
                  </ul>
                </div>

                {/* API Endpoints */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    API Endpoints
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          GET /api/getUser
                        </code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Fetch all users with their posts
                      </p>
                    </li>
                    <li>
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          POST /api/addUser
                        </code>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Seed database with dummy data (6 users, 12 posts)
                      </p>
                    </li>
                  </ul>
                </div>

                {/* Customization Tips */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Customization Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Modify table columns by editing the table headers and
                        cells
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Add new API routes in{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          app/api/
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Customize styling using Tailwind classes or theme
                        variables
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Update Prisma schema and run migrations for new models
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        You can add the button to insert the data into users and
                        post as per your choice!
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message Thread Collapsible - Fixed position (on top of Template Guide) */}
      <MessageThreadCollapsible
        defaultOpen={false}
        className="fixed bottom-6 right-4 z-50"
      />
    </div>
  );
}
