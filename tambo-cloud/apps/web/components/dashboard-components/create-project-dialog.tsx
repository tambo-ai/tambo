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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    projectName: string,
    providerKey: string,
  ) => Promise<{ id: string }>;
}

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  providerKey: z.string().min(1, "API key is required"),
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

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
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
        values.providerKey.trim(),
      );
      form.reset();

      // Navigate to project details page after successful creation
      if (project?.id) {
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
              className="space-y-6"
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
              </motion.div>
              <motion.div variants={itemVariants}>
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
                      <p className="text-sm text-muted-foreground mt-2">
                        Tambo will use your API key to make AI calls on your
                        behalf until we implement our payment system.
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
