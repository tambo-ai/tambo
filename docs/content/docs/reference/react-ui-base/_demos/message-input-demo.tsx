"use client";

import { DemoPreview } from "@/components/demos/demo-preview";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import { ArrowUp, Paperclip, Square } from "lucide-react";

export const messageInputDemoCode = `
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import { ArrowUp, Paperclip, Square } from "lucide-react";

export function DemoMessageInput() {
  return (
    <MessageInput.Root className="flex flex-col gap-2">
      <MessageInput.Content className="flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <MessageInput.Textarea className="min-h-20 w-full resize-none rounded-t-xl bg-transparent px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500" />
        <MessageInput.Toolbar className="flex items-center gap-2 border-t border-neutral-100 px-2 py-1.5 dark:border-neutral-700">
          <MessageInput.FileButton className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200">
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </MessageInput.FileButton>
          <div className="ml-auto flex items-center gap-2">
            <MessageInput.SubmitButton className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300">
              <ArrowUp className="h-4 w-4" />
            </MessageInput.SubmitButton>
            <MessageInput.StopButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">
              <Square className="h-3.5 w-3.5" fill="currentColor" />
            </MessageInput.StopButton>
          </div>
        </MessageInput.Toolbar>
      </MessageInput.Content>
      <MessageInput.Elicitation />
      <MessageInput.Error className="text-sm text-red-600 dark:text-red-400" />
    </MessageInput.Root>
  );
}`.trimStart();

export function MessageInputDemoPreview() {
  return (
    <DemoPreview code={messageInputDemoCode}>
      <MessageInputDemo />
    </DemoPreview>
  );
}

function MessageInputDemo() {
  return (
    <MessageInput.Root className="flex flex-col gap-2">
      <MessageInput.Content className="flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <MessageInput.Textarea className="min-h-20 w-full resize-none rounded-t-xl bg-transparent px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500" />
        <MessageInput.Toolbar className="flex items-center gap-2 border-t border-neutral-100 px-2 py-1.5 dark:border-neutral-700">
          <MessageInput.FileButton className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200">
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </MessageInput.FileButton>
          <div className="ml-auto flex items-center gap-2">
            <MessageInput.SubmitButton className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300">
              <ArrowUp className="h-4 w-4" />
            </MessageInput.SubmitButton>
            <MessageInput.StopButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">
              <Square className="h-3.5 w-3.5" fill="currentColor" />
            </MessageInput.StopButton>
          </div>
        </MessageInput.Toolbar>
      </MessageInput.Content>
      <MessageInput.Elicitation />
      <MessageInput.Error className="text-sm text-red-600 dark:text-red-400" />
    </MessageInput.Root>
  );
}
