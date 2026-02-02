"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputToolbar,
} from "@tambo-ai/ui-registry/components/message-input";
import { MessageInputTextareaWithInteractables } from "@/components/ui/tambo/message-input-with-interactables";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import { ComponentsThemeProvider } from "@/providers/components-theme-provider";
import { useTambo, useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SubscribeForm, SubscribeFormProps } from "./subscribe-form";

export function TamboSubscribeIntegration() {
  const { registerComponent, thread } = useTambo();
  // This hook is still necessary even though we don't use its return values directly.
  // It registers the thread input context with the Tambo system.
  useTamboThreadInput();
  const { sendThreadMessage } = useTamboThread();
  const isRegistered = useRef(false);
  const hasMessageBeenSent = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);

  // Register the component once
  useEffect(() => {
    if (isRegistered.current) return;

    // Register the component
    registerComponent({
      name: "SubscribeForm",
      description:
        "A form component for subscription information with firstName, lastName, title, and email fields.",
      component: SubscribeForm,
      propsDefinition: zodToJsonSchema(SubscribeFormProps),
    });

    isRegistered.current = true;
  }, [registerComponent]);

  // Send initial message when dialog is closed
  const handleWelcomeDialogClose = async () => {
    setShowWelcomeDialog(false);
    if (!hasMessageBeenSent.current) {
      await sendThreadMessage("subscribe me pls.", { streamResponse: true });
      hasMessageBeenSent.current = true;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && thread.messages.length) {
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [thread.messages]);

  return (
    <>
      <Dialog open={showWelcomeDialog} onOpenChange={handleWelcomeDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Tambo Subscribe!</DialogTitle>
            <DialogDescription>
              Let us help you get signed up for updates. We&apos;ll guide you
              through the process of filling out your subscription information.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleWelcomeDialogClose}>Get Started</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ComponentsThemeProvider defaultTheme="light">
        <div className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden bg-background border border-gray-200 h-[calc(100vh-var(--header-height)-4rem)] sm:h-[85vh] md:h-[80vh]">
          <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-base sm:text-lg">
              Subscribe Form
            </h2>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
          >
            <ThreadContent className="py-3 sm:py-4">
              <ThreadContentMessages />
            </ThreadContent>
          </div>
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <MessageInput>
              <MessageInputTextareaWithInteractables />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
              <MessageInputError />
            </MessageInput>
          </div>
        </div>
      </ComponentsThemeProvider>
    </>
  );
}
