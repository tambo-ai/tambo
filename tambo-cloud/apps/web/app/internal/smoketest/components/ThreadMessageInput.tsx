import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTamboThreadInput } from "@hydra-ai/react";
import { FC } from "react";

interface ThreadMessageInputProps {
  contextKey: string | undefined;
}

const ThreadMessageInput: FC<ThreadMessageInputProps> = ({ contextKey }) => {
  const { value, setValue, submit, isSubmitting, error } =
    useTamboThreadInput(contextKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await submit();
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
        disabled={isSubmitting}
        className="flex-1"
      />
      <Button type="submit" disabled={isSubmitting}>
        Send
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
};

export { ThreadMessageInput };
