"use client";

import { MessageInput } from "@tambo-ai/react-ui-base/message-input";

export function MessageInputDemo() {
  return (
    <div className="not-prose rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <MessageInput.Root>
        <MessageInput.Content>
          <MessageInput.Textarea />
          <MessageInput.Toolbar>
            <MessageInput.FileButton>Attach</MessageInput.FileButton>
            <MessageInput.SubmitButton keepMounted>
              Send
            </MessageInput.SubmitButton>
            <MessageInput.StopButton keepMounted>Stop</MessageInput.StopButton>
          </MessageInput.Toolbar>
        </MessageInput.Content>
        <MessageInput.Elicitation />
        <MessageInput.Error />
      </MessageInput.Root>
    </div>
  );
}
