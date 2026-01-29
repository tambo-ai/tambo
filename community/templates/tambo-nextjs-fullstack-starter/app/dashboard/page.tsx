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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
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

  useEffect(() => {
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-sm text-foreground">User and Post Data</p>
        </div>

        {/* loader  */}
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
            {/* table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users Table  */}
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

              {/* Posts Table*/}
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
                              <span className="text-foreground text-xs">
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
          </>
        )}
      </div>

      <MessageThreadCollapsible
        defaultOpen={false}
        className="fixed bottom-6 right-4 z-50"
      />
    </div>
  );
}
