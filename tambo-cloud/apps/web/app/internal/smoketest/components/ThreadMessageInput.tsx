import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTamboThreadInput } from "@hydra-ai/react";

export function ThreadMessageInput() {
  const { value, setValue, submit, isSubmitting, error } =
    useTamboThreadInput();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await submit();
  };

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
}
