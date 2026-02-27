"use client";

import { useDemoControls } from "@/components/demos/demo-controls";
import type { Content, TamboThreadMessage } from "@tambo-ai/react";
import { Message } from "@tambo-ai/react-ui-base/message";
import type { ChatCompletionContentPart } from "@tambo-ai/typescript-sdk/resources/beta/threads/threads";
import { Bot, User } from "lucide-react";
import { useMemo } from "react";

function DemoWeatherCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="text-2xl">72°F</div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        <div className="font-medium text-neutral-900 dark:text-neutral-100">
          San Francisco
        </div>
        Partly cloudy
      </div>
    </div>
  );
}

const IMAGE_URL =
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=200&fit=crop";

export function MessageDemo() {
  const { images, component, loading } = useDemoControls({
    images: { default: true, label: "Images" },
    component: { default: true, label: "Component" },
    loading: { default: false, label: "Loading" },
  });

  // Content array includes ChatCompletionContentPart for image_url blocks,
  // which Message.Images handles at runtime but isn't in the Content union.
  const userMessage = useMemo(
    () => ({
      id: "demo-msg-user",
      role: "user" as const,
      content: [
        {
          type: "text",
          text: "What's the weather like in San Francisco?",
        } satisfies Content,
        ...(images
          ? [
              {
                type: "image_url",
                image_url: { url: IMAGE_URL },
              } satisfies ChatCompletionContentPart,
            ]
          : []),
      ] as Content[],
    }),
    [images],
  );

  const assistantMessage = useMemo(
    () =>
      ({
        id: "demo-msg-assistant",
        role: "assistant",
        content: [
          ...(loading
            ? []
            : [
                {
                  type: "text",
                  text: "It's currently 72°F and partly cloudy in San Francisco.",
                } satisfies Content,
                ...(component
                  ? [
                      {
                        type: "component",
                        id: "demo-weather",
                        name: "WeatherCard",
                        props: {},
                        renderedComponent: <DemoWeatherCard />,
                      } satisfies Content,
                    ]
                  : []),
              ]),
        ],
      }) satisfies TamboThreadMessage,
    [component, loading],
  );

  return (
    <div className="flex flex-col gap-3">
      <MessageBubble message={userMessage} role={userMessage.role} />
      <MessageBubble
        message={assistantMessage}
        role={assistantMessage.role}
        isLoading={loading}
      />
    </div>
  );
}

function MessageBubble({
  message,
  role,
  isLoading = false,
}: {
  message: TamboThreadMessage;
  role: "user" | "assistant";
  isLoading?: boolean;
}) {
  return (
    <Message.Root
      message={message}
      role={role}
      isLoading={isLoading}
      className="flex gap-2.5 [[data-role=user]&]:flex-row-reverse"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 [[data-role=user]_&]:bg-neutral-900 [[data-role=user]_&]:text-white dark:bg-neutral-700 dark:text-neutral-300 dark:[[data-role=user]_&]:bg-neutral-100 dark:[[data-role=user]_&]:text-neutral-900">
        <User className="hidden h-3.5 w-3.5 [[data-role=user]_&]:block" />
        <Bot className="hidden h-3.5 w-3.5 [[data-role=assistant]_&]:block" />
      </div>
      <div className="flex max-w-[80%] flex-col gap-2 rounded-2xl rounded-tl-md bg-neutral-200/70 px-4 py-3 text-neutral-900 [[data-role=user]_&]:rounded-2xl [[data-role=user]_&]:rounded-tr-md [[data-role=user]_&]:bg-neutral-900 [[data-role=user]_&]:text-white dark:bg-neutral-700 dark:text-neutral-100 dark:[[data-role=user]_&]:bg-neutral-100 dark:[[data-role=user]_&]:text-neutral-900">
        <Message.Content className="text-sm" />
        <Message.Images className="flex gap-2 [&_img]:max-h-40 [&_img]:rounded-lg [&_img]:object-cover" />
        <Message.RenderedComponent>
          <Message.RenderedComponentContent />
        </Message.RenderedComponent>
        <Message.LoadingIndicator
          className={
            "flex items-center gap-1 text-sm opacity-50 " +
            "[&_[data-dot]]:inline-block [&_[data-dot]]:h-1.5 [&_[data-dot]]:w-1.5 [&_[data-dot]]:rounded-full [&_[data-dot]]:bg-current [&_[data-dot]]:animate-pulse " +
            "[&_[data-dot='1']]:[animation-delay:0ms] " +
            "[&_[data-dot='2']]:[animation-delay:150ms] " +
            "[&_[data-dot='3']]:[animation-delay:300ms] "
          }
        />
      </div>
    </Message.Root>
  );
}
