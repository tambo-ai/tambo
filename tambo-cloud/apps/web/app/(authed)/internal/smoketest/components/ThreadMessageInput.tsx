import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTamboThreadInput } from "@tambo-ai/react";
import { FC, useState } from "react";

interface ThreadMessageInputProps {
  contextKey: string | undefined;
  onSubmit: (value: string) => void;
}

const ThreadMessageInput: FC<ThreadMessageInputProps> = ({
  contextKey,
  onSubmit,
}) => {
  const { value, setValue, submit, isPending, error } =
    useTamboThreadInput(contextKey);
  const [streamEnabled, setStreamEnabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await submit({ streamResponse: streamEnabled });
    onSubmit(value);
  };
  if (!contextKey) {
    return (
      <p className="text-destructive">
        No context key provided, cannot send messages
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending}>
            Send
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="streamToggle"
            checked={streamEnabled}
            onChange={(e) => setStreamEnabled(e.target.checked)}
          />
          <label
            htmlFor="streamToggle"
            className="text-sm text-muted-foreground"
          >
            Stream response
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>
    </form>
  );
};

export { ThreadMessageInput };
