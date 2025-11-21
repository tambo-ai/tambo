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
import { api } from "@/trpc/react";
import { useState } from "react";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDialog({ open, onOpenChange }: EmailDialogProps) {
  const [email, setEmail] = useState("");
  const {
    mutateAsync: subscribe,
    isPending,
    error,
    isSuccess,
  } = api.app.subscribe.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await subscribe({ email });
    setEmail("");
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
          {error && <p className="text-sm text-red-500">{error.message}</p>}
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
