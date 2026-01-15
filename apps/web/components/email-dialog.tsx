"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDialog({ open, onOpenChange }: EmailDialogProps) {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ready to Build?</DialogTitle>
          <DialogDescription>
            Want to learn what you can build with Tambo AI?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending || isSuccess}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {isSuccess ? (
            <div className="flex items-center gap-2 text-green-500">
              <Icons.logo className="h-6 w-auto" aria-label="Success" />
              <span>Thanks for reaching out!</span>
            </div>
          ) : (
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Sending email...
                </>
              ) : (
                "Send us a Note"
              )}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
