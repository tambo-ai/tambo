"use client";

import { TamboChat } from "@tambo-ai/react";

export default function Chat() {
  return (
    <div className="h-full w-full border rounded-lg">
      <TamboChat
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        systemPrompt="You are a helpful assistant inside a Next.js app."
      />
    </div>
  );
}
