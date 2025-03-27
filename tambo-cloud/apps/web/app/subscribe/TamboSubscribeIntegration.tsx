"use client";
import "regenerator-runtime/runtime";

import { MessageInput } from "@/components/ui/tambo/message-input";
import { ThreadContent } from "@/components/ui/tambo/thread-content";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef } from "react";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SubscribeForm, SubscribeFormProps } from "./SubscribeForm";

export function TamboSubscribeIntegration() {
  const { registerComponent, thread } = useTambo();
  const contextKey = "subscribe-form";
  const { setValue, submit } = useTamboThreadInput(contextKey);
  const isRegistered = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Register the component once and send initial message
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

    // Send initial message immediately
    setValue(
      "Use the SubscribeForm component to display a subscription form with empty values for firstName, lastName, title, and email fields.",
    );
    submit({ streamResponse: true });

    isRegistered.current = true;
  }, [registerComponent, setValue, submit]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && thread?.messages?.length) {
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
  }, [thread?.messages]);

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden bg-background border border-gray-200 h-[calc(100vh-var(--header-height)-4rem)] sm:h-[85vh] md:h-[80vh]">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-base sm:text-lg">Subscribe Form</h2>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        <ThreadContent className="py-3 sm:py-4" />
      </div>
      <div className="p-3 sm:p-4 border-t border-gray-200">
        <MessageInput contextKey={contextKey} className="bg-white" />
      </div>
    </div>
  );
}
