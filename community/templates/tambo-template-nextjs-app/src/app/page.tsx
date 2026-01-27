"use client";

import { TamboProvider, useTamboThreadInput } from "@tambo-ai/react";

function Chat() {
  const { value, setValue, submit } = useTamboThreadInput();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tambo Chat</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}>
      <Chat />
    </TamboProvider>
  );
}
