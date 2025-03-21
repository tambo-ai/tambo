"use client";
import "regenerator-runtime/runtime";

import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SpeechTranscription } from "./SpeechTranscription";
import { SubscribeForm, SubscribeFormProps } from "./SubscribeForm";

export function TamboSubscribeIntegration() {
  const { registerComponent, thread, isIdle, generationStage } = useTambo();
  const contextKey = "subscribe-form";
  const { setValue, submit } = useTamboThreadInput(contextKey);
  const isRegistered = useRef(false);
  const [lastValidRenderedComponent, setLastValidRenderedComponent] =
    useState<React.ReactNode | null>(null);

  // Register the component once
  useEffect(() => {
    if (isRegistered.current) return;

    registerComponent({
      name: "SubscribeForm",
      description:
        "A form component for subscription information with firstName, lastName, title, and email fields.",
      component: SubscribeForm,
      propsDefinition: zodToJsonSchema(SubscribeFormProps),
    });

    isRegistered.current = true;
  }, [registerComponent]);

  // Initialize form with empty values if thread is empty
  useEffect(() => {
    if (!thread?.messages?.length) {
      setValue(
        "Use the SubscribeForm component to display a subscription form with empty values for firstName, lastName, title, and email fields.",
      );
      setTimeout(() => {
        submit({ streamResponse: true });
      }, 100);
    }
  }, [thread?.messages, setValue, submit]);

  // Get processing status
  const isProcessing = !isIdle;
  const processingStage = isProcessing ? generationStage : null;

  // Find the most recent component and update the cached version when valid
  const messages = thread?.messages || [];
  const lastMessage = [...messages].reverse().find((m) => m);

  useEffect(() => {
    if (lastMessage?.renderedComponent) {
      setLastValidRenderedComponent(lastMessage.renderedComponent);
    }
  }, [lastMessage?.renderedComponent]);

  // Determine what to display - either the latest rendered component or the cached one
  const displayComponent =
    lastMessage?.renderedComponent || lastValidRenderedComponent;

  return (
    <div className="flex flex-col gap-6">
      {/* Show current form component or cached version or loading */}
      <div className="border p-4 rounded-lg shadow-sm">
        {displayComponent ? (
          displayComponent
        ) : (
          <div className="text-center p-4">
            <div className="animate-pulse">Loading subscription form...</div>
          </div>
        )}
      </div>

      {/* Speech Input */}
      <SpeechTranscription
        contextKey={contextKey}
        isProcessing={isProcessing}
        processingStage={processingStage}
      />
    </div>
  );
}
