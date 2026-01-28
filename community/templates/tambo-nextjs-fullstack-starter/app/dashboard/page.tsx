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
  AlertCircle,
  BookOpen,
  ChevronRight,
  Code,
  ExternalLink,
  FileCode,
  Heart,
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
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {session?.user?.name
              ? `Welcome, ${session.user.name.split(" ")[0]}`
              : "Dashboard"}
          </h1>
          <p className="text-sm text-foreground">User and Post Data</p>
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

            {/* Template Guide - Below Tables */}
            <div className="mt-12">
              <div className="bg-card border-2 border-border rounded-xl p-8 space-y-4 shadow-sm">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 ">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-bold text-foreground">
                      Template Guide
                    </h3>
                  </div>
                </div>

                {/* Flow Maps Section */}
                <div className="border-t-2 border-border pt-7">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                    <Code className="h-5 w-5 text-primary" />
                    How Actions Work: Step-by-Step
                  </h4>
                  <p className="text-sm text-foreground mb-6 leading-relaxed">
                    This section uses bullet points to show how
                    <strong className="text-foreground font-semibold">
                      {" "}
                      Tambo AI{" "}
                    </strong>
                    processes user requests and interacts with your application.
                    You&apos;ll see each stage from user input to the delivered
                    result.
                  </p>

                  {/* Flow A: Bar Chart Showing - As Bullets */}
                  <div className="mb-10">
                    <h5 className="text-base font-bold mb-3 flex items-center gap-3 text-foreground">
                      <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-sm">
                        A
                      </span>
                      Showing a Bar Chart: Step-by-Step
                    </h5>
                    <p className="text-sm text-foreground mb-4 pl-10 font-medium">
                      When you ask:{" "}
                      <strong className="text-foreground">
                        &quot;Show me a bar chart of users&quot;
                      </strong>{" "}
                      or{" "}
                      <strong className="text-foreground">
                        &quot;Generate summary for user table&quot;
                      </strong>
                    </p>
                    <ul className="bg-white dark:bg-background rounded-lg p-6 border-2 border-border shadow-md space-y-3 text-sm list-disc list-inside">
                      <li>
                        <span className="text-primary font-bold">AI</span> scans
                        tool descriptions and locates{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          getUsersData
                        </code>{" "}
                        tool.
                      </li>
                      <li>
                        <span className="text-primary font-bold">AI</span>{" "}
                        executes{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          getUsersData()
                        </code>
                        .
                      </li>
                      <li>
                        <code className="bg-primary/10 text-primary px-2  rounded font-bold border border-primary/20">
                          getUsersData()
                        </code>{" "}
                        executes:
                        <ul className="pl-6 space-y-1 my-3  list-[circle]">
                          <li>
                            <span className="text-primary font-bold">1.</span>{" "}
                            <code className="bg-muted px-2 py-1 rounded text-xs border font-mono">
                              fetch(&quot;/api/getUser&quot;)
                            </code>
                          </li>
                          <li>
                            <span className="text-primary font-bold">2.</span>{" "}
                            Transform data to{" "}
                            <code className="bg-muted px-2 py-1 my-3 rounded text-xs border font-mono">
                              {`[{User: "John", Posts: 5}, ...]`}
                            </code>
                          </li>
                          <li>
                            <span className="text-primary font-bold">3.</span>{" "}
                            Returns{" "}
                            <code className="bg-muted px-2 py-1 rounded text-xs border font-mono">
                              {`{data, title, description}`}
                            </code>
                          </li>
                        </ul>
                      </li>
                      <li>
                        <span className="text-primary font-bold">AI</span>{" "}
                        receives the tool output.
                      </li>
                      <li>
                        <span className="text-primary font-bold">AI</span> reads
                        component descriptions and finds the{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          BarChart
                        </code>{" "}
                        component.
                      </li>
                      <li>
                        <span className="text-primary font-bold">AI</span>{" "}
                        validates props according to{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          propsSchema
                        </code>
                        .
                      </li>
                      <li>
                        <span className="text-primary font-bold">AI</span>{" "}
                        renders the chart with:
                        <br />
                        <code className="bg-muted px-2 py-1 rounded text-xs border font-mono">
                          {`<BarChart data={...} title={...} description={...} />`}
                        </code>
                      </li>
                      <li>
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          ChartBarLabelCustom
                        </code>{" "}
                        component displays the chart to the user.
                      </li>
                    </ul>
                    <div className="mt-5 pt-5 border-t-2 border-border">
                      <p className="text-foreground mb-3 font-bold text-sm">
                        Key Concepts:
                      </p>
                      <ul className="space-y-2 text-sm list-disc list-inside">
                        <li>
                          <strong className="text-primary font-bold">
                            Tools
                          </strong>{" "}
                          (in{" "}
                          <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs border font-mono font-semibold">
                            lib/tambo.ts
                          </code>
                          ): <strong>Fetch and process data</strong> from your
                          APIs.
                        </li>
                        <li>
                          <strong className="text-primary font-bold">
                            Components
                          </strong>{" "}
                          (in{" "}
                          <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs border font-mono font-semibold">
                            lib/tambo.ts
                          </code>
                          ): <strong>Render UI elements</strong> with validated
                          props.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Flow B: Adding Data to Table - As Bullets */}
                  <div className="mt-10">
                    <h5 className="text-base font-bold mb-3 flex items-center gap-3 text-foreground">
                      <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-sm">
                        B
                      </span>
                      Adding Data to Users Table: Step-by-Step
                    </h5>
                    <p className="text-sm text-foreground mb-4 pl-10 font-medium">
                      When you ask:{" "}
                      <strong className="text-foreground">
                        &quot;Add data to users table&quot;
                      </strong>{" "}
                      or{" "}
                      <strong className="text-foreground">
                        &quot;Create a new user&quot;
                      </strong>
                    </p>
                    <ul className="bg-white dark:bg-background rounded-lg p-6 border-2 border-border shadow-md space-y-3 text-sm list-disc list-inside">
                      <li>
                        <span className="text-primary font-bold">User</span>{" "}
                        fills out the form and clicks the{" "}
                        <strong className="text-foreground">
                          &quot;Add User &amp; Post&quot;
                        </strong>{" "}
                        button.
                      </li>
                      <li>
                        <span className="text-primary font-bold">
                          Client-side validation:
                        </span>
                        <ul className="pl-6 list-[circle] space-y-1">
                          <li>Email format check</li>
                          <li>Post title required check</li>
                        </ul>
                      </li>
                      <li>
                        Form sends a{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          POST /api/addUser
                        </code>{" "}
                        request with the user and post data.
                      </li>
                      <li>
                        <span className="text-primary font-bold">Server</span>{" "}
                        validates and checks for{" "}
                        <strong className="text-foreground">
                          duplicate email
                        </strong>
                        .
                      </li>
                      <li>
                        <span className="text-primary font-bold">
                          Prisma transaction
                        </span>{" "}
                        creates:
                        <ul className="pl-6 list-[circle] space-y-1">
                          <li>User record in the database</li>
                          <li>Post record linked to the user</li>
                        </ul>
                      </li>
                      <li>
                        <span className="text-primary font-bold">API</span>{" "}
                        returns a success response with the created user and
                        post data.
                      </li>
                      <li>
                        The form sends feedback to{" "}
                        <strong className="text-primary">Tambo AI</strong> using{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          sendThreadMessage()
                        </code>
                        .
                      </li>
                      <li>
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          onRefresh()
                        </code>{" "}
                        callback triggers table refresh.
                      </li>
                      <li>
                        Dashboard fetches the updated data again using{" "}
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold border border-primary/20">
                          /api/getUser
                        </code>
                        .
                      </li>
                      <li>
                        <span className="text-foreground">
                          Tables automatically update with the new user and
                          post.
                        </span>
                      </li>
                      <li>
                        The form{" "}
                        <span className="text-foreground font-bold">
                          resets all fields
                        </span>
                        .
                      </li>
                      <li>
                        <span className="text-primary font-bold">Tambo AI</span>{" "}
                        receives feedback and can confirm the action.
                      </li>
                    </ul>
                    <div className="mt-5 pt-5 border-t-2 border-border">
                      <p className="text-foreground mb-3 font-bold text-sm">
                        Key Features:
                      </p>
                      <ul className="space-y-2 text-sm list-disc list-inside">
                        <li>
                          <strong className="text-primary font-bold">
                            Atomic Transaction:
                          </strong>{" "}
                          User and post are created together{" "}
                          <span className="text-foreground">
                            (all-or-nothing)
                          </span>
                        </li>
                        <li>
                          <strong className="text-primary font-bold">
                            AI Feedback:
                          </strong>{" "}
                          Real-time updates via{" "}
                          <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs border font-mono font-semibold">
                            useTamboThread()
                          </code>{" "}
                          hook.
                        </li>
                        <li>
                          <strong className="text-primary font-bold">
                            Auto Refresh:
                          </strong>{" "}
                          Tables update{" "}
                          <span className="text-foreground">
                            automatically without page reload
                          </span>
                        </li>
                        <li>
                          <strong className="text-primary font-bold">
                            Error Handling:
                          </strong>{" "}
                          <span className="text-foreground">
                            User-friendly messages
                          </span>{" "}
                          at each validation step.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Project Structure */}
                <div className="border-t-2 border-border pt-8">
                  <h4 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <FileCode className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Project Structure & Key Files
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-4 shadow-sm">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-3">
                        Frontend Files
                      </p>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            app/dashboard/page.tsx
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            Main dashboard component - customize layout, tables,
                            and UI
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            components/tambo/add-user-form.tsx
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            Form component for adding users - can be rendered by
                            AI
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            lib/tambo.ts
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            Register all Tambo tools and components here
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-4 shadow-sm">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-3">
                        Backend Files
                      </p>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            app/api/getUser/route.ts
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            API endpoint to fetch all users with their posts
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            app/api/addUser/route.ts
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            API endpoint to create new users and posts
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-white dark:bg-background px-2 py-1 rounded border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            prisma/schema.prisma
                          </code>
                          <p className="text-xs text-foreground mt-1">
                            Database schema - define your models and
                            relationships here
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What to Keep in Mind */}
                <div className="border-t-2 border-border pt-8">
                  <h4 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Important Things to Keep in Mind
                  </h4>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-5 space-y-3 shadow-sm">
                    <ul className="space-y-3 text-sm text-foreground">
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            Tool & Component Registration:
                          </strong>{" "}
                          All tools and components must be registered in{" "}
                          <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            lib/tambo.ts
                          </code>{" "}
                          for{" "}
                          <strong className="text-foreground">Tambo AI</strong>{" "}
                          to use them
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            Schema Validation:
                          </strong>{" "}
                          Component props are validated using{" "}
                          <strong className="text-foreground">
                            Zod schemas
                          </strong>{" "}
                          - ensure your schemas match your component props
                          exactly
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            Database Migrations:
                          </strong>{" "}
                          Always run{" "}
                          <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            npx prisma migrate dev
                          </code>{" "}
                          after changing{" "}
                          <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-amber-300 dark:border-amber-700 font-mono font-semibold">
                            schema.prisma
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            Error Handling:
                          </strong>{" "}
                          Always handle errors in API routes and provide{" "}
                          <strong className="text-foreground">
                            meaningful error messages
                          </strong>{" "}
                          to users
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            Type Safety:
                          </strong>{" "}
                          Use{" "}
                          <strong className="text-foreground">
                            TypeScript types
                          </strong>{" "}
                          that match your Prisma schema for better type-checking
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 font-bold" />
                        <span className="leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-300 font-bold">
                            AI Descriptions:
                          </strong>{" "}
                          Write{" "}
                          <strong className="text-foreground">
                            clear, descriptive
                          </strong>{" "}
                          tool and component descriptions - the AI uses these to
                          understand when to use them
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Tambo AI Documentation */}
                <div className="border-t-2 border-border pt-8">
                  <h4 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Learn More About Tambo AI
                  </h4>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-5 shadow-sm">
                    <p className="text-sm text-foreground mb-4 leading-relaxed font-medium">
                      Want to dive deeper into{" "}
                      <strong className="text-amber-700 dark:text-amber-300 font-bold">
                        Tambo AI
                      </strong>
                      ? Check out the official documentation to learn about{" "}
                      <strong className="text-foreground font-bold">
                        advanced features, best practices, and more examples
                      </strong>
                      .
                    </p>
                    <a
                      href="https://docs.tambo.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors bg-white dark:bg-background px-4 py-2 rounded-lg border-2 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm"
                    >
                      <span>Visit Tambo AI Documentation</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Customization Tips */}
                <div className="border-t-2 border-border pt-8">
                  <h4 className="text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                    <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Quick Customization Tips
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                        Modify Tables
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        Edit table headers and cells in{" "}
                        <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-green-300 dark:border-green-700 font-mono font-bold">
                          app/dashboard/page.tsx
                        </code>
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                        Add API Routes
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        Create new endpoints in{" "}
                        <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-green-300 dark:border-green-700 font-mono font-bold">
                          app/api/
                        </code>{" "}
                        directory
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                        Customize Styling
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        Use{" "}
                        <strong className="text-foreground font-bold">
                          Tailwind classes
                        </strong>{" "}
                        or theme variables for consistent design
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                        Update Schema
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        Modify{" "}
                        <code className="bg-white dark:bg-background px-2 py-1 rounded text-xs border-2 border-green-300 dark:border-green-700 font-mono font-bold">
                          prisma/schema.prisma
                        </code>{" "}
                        and{" "}
                        <strong className="text-foreground font-bold">
                          run migrations
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-border pt-8 mt-8">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-lg border-2 border-red-200 dark:border-red-900">
                      <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                      <span className="font-bold text-foreground">
                        Don&apos;t forget to like Tambo AI
                      </span>
                    </div>
                    <span className="hidden sm:inline text-foreground font-bold">
                      •
                    </span>
                    <a
                      href="https://tambo.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-2 font-bold text-primary hover:underline"
                    >
                      <span>Visit Tambo AI</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
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
