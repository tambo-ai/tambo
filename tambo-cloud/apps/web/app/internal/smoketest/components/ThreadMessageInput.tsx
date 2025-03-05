import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTamboThreadInput } from "@hydra-ai/react";
import { FC } from "react";

interface ThreadMessageInputProps {
  contextKey: string | undefined;
}

const ThreadMessageInput: FC<ThreadMessageInputProps> = ({ contextKey }) => {
  const { value, setValue, submit, isPending, error } =
    useTamboThreadInput(contextKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    submit();
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
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </form>
  );
};

export { ThreadMessageInput };
