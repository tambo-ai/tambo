"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { account } from "@/lib/appwrite";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { LogOut, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tambo + Appwrite</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {Array.isArray(message.content) ? (
                message.content.map((part, i) =>
                  part.type === "text" ? (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : null,
                )
              ) : (
                <p className="whitespace-pre-wrap">{String(message.content)}</p>
              )}
              {message.renderedComponent}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask AI to create a note..."
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !value.trim()}>
          <Send className="w-4 h-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
