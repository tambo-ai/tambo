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
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    projectName: string,
    providerKey?: string,
  ) => Promise<{ id: string }>;
}

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  providerKey: z.string().optional(),
});

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const isValidOpenAIKey = (key: string): boolean => {
  return !key || (key.startsWith("sk-") && key.length >= 51);
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const router = useRouter();
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
      const project = await onSubmit(
        values.projectName.trim(),
        values.providerKey ? values.providerKey.trim() : undefined,
      );
      form.reset();

      // Navigate to project details page after successful creation
      if (project.id) {
        router.push(`/dashboard/${project.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <DialogHeader className="mb-6">
            <motion.div variants={itemVariants}>
              <DialogTitle className="font-heading">
                Create New Project
              </DialogTitle>
            </motion.div>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-2"
            >
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Project name"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-1 p-2">
                  <p className="text-xs text-muted-foreground">
                    Start with 500 free messages, or add your own LLM Provider
                    Key. You can add one at any time in the project settings.
                  </p>
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <div>
                  <label
                    htmlFor="providerKey"
                    className="flex justify-between items-center text-sm font-medium mb-2"
                  >
                    <span>LLM Provider (Optional)</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 -mr-2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </label>

                  {showApiKey && (
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <FormField
                        control={form.control}
                        name="providerKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenAI API Key</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="sk-..."
                                autoComplete="new-password"
                                pattern="sk-.*"
                                title="OpenAI API key must start with 'sk-'"
                                onChange={(e) => {
                                  const newKey = e.target.value;
                                  if (newKey && !isValidOpenAIKey(newKey)) {
                                    e.target.setCustomValidity(
                                      "Please enter a valid OpenAI API key (starts with sk-)",
                                    );
                                  } else {
                                    e.target.setCustomValidity("");
                                  }
                                  field.onChange(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1">
                              Create or find your key in the{" "}
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
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="pt-2">
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
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
