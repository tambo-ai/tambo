import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectName: string, providerKey: string) => Promise<void>;
}

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  providerKey: z.string().min(1, "API key is required"),
});

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      providerKey: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await onSubmit(values.projectName.trim(), values.providerKey.trim());
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Project name" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="providerKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your OpenAI API Key</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Provider API Key" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Tambo will use your API key to make AI calls on your behalf
                    until we implement our payment system.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can find or create your API key in the{" "}
                    <a
                      href="https://platform.openai.com/settings/organization/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      OpenAI API keys page
                    </a>
                    .
                  </p>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
