"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTamboThread } from "@tambo-ai/react";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface AddUserFormProps {
  onSubmit?: (data: {
    email: string;
    name?: string;
    postTitle: string;
    postContent?: string;
    published: boolean;
  }) => void;
  onSuccess?: (data: {
    user: {
      id: number;
      email: string;
      name: string | null;
    };
    post: {
      id: number;
      title: string;
      content: string | null;
      published: boolean;
    };
  }) => void;
  onError?: (error: string) => void;
  onRefresh?: () => void;
}

export function AddUserForm({
  onSubmit,
  onSuccess,
  onError,
  onRefresh,
}: AddUserFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [published, setPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendThreadMessage, thread } = useTamboThread();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate email
    if (!email || !email.trim()) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    // Validate post title
    if (!postTitle || !postTitle.trim()) {
      setError("Post title is required");
      setIsSubmitting(false);
      return;
    }

    try {
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit({
          email: email.trim(),
          name: name.trim() || undefined,
          postTitle: postTitle.trim(),
          postContent: postContent.trim() || undefined,
          published,
        });
      }

      // Make POST request to /api/addUser
      const response = await fetch("/api/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          post: {
            title: postTitle.trim(),
            content: postContent.trim() || null,
            published,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to add user: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Send feedback message to Tambo AI
      try {
        const successMessage = `Successfully added a new user to the database! User details: Email: ${data.user.email}, Name: ${data.user.name || "N/A"}, User ID: ${data.user.id}. Post details: Title: "${data.post.title}", Published: ${data.post.published ? "Yes" : "No"}, Post ID: ${data.post.id}. The user table has been updated.`;
        await sendThreadMessage(successMessage, {
          threadId: thread.id,
          streamResponse: true,
        });
      } catch (aiError) {
        // Don't fail the form submission if AI feedback fails
        console.error("Failed to send AI feedback:", aiError);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }

      // Refresh the table data
      if (onRefresh) {
        onRefresh();
      }

      // Reset form
      setEmail("");
      setName("");
      setPostTitle("");
      setPostContent("");
      setPublished(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add user";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: session } = useSession();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
        <CardDescription>
          Enter user information and their first post to add to the database
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">User Information</h3>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={session?.user?.email || "user@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder={session?.user?.name || "user.name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Post Information</h3>
            <div className="space-y-2">
              <Label htmlFor="postTitle">
                Post Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postTitle"
                type="text"
                placeholder="Enter post title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postContent">Content</Label>
              <Textarea
                id="postContent"
                placeholder="Enter post content (optional)"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2 mb-4 ">
              <Checkbox
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="published"
                className="text-sm font-normal cursor-pointer"
              >
                Published
              </Label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive rounded-md bg-destructive/10 p-3">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : "Add User & Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
