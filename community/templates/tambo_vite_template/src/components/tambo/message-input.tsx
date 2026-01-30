import { useState } from "react";
import { useTambo } from "@tambo-ai/react";

export default function MessageInput() {
  const [value, setValue] = useState("");
  const { sendMessage, isLoading } = useTambo();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    sendMessage(value);
    setValue("");
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 p-4 border-t">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
        placeholder="Type a message…"
        className="flex-1 border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Send
      </button>
    </form>
  );
}
