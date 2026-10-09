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
import * as z from "zod/v3";

/**
 * Props for the CreateProjectDialog component
 * @interface CreateProjectDialogProps
 */
interface CreateProjectDialogProps {
  /** Whether the dialog is open */
  open?: boolean;
  /** Callback function when dialog open state changes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Callback function when form is submitted
   * @param projectName - The name of the project to create
   * @returns Promise resolving to an object containing the created project's ID
   */
  onSubmit: (projectName: string) => Promise<{ id: string }>;
  /** Custom title for the dialog */
  title?: string;
  /**
   * Whether to prevent automatic navigation after project creation
   * When true, the dialog won't navigate to the project dashboard after creation
   */
  preventNavigation?: boolean;
}

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
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

/**
 * A dialog component for creating new projects.
 *
 * @component
 * @example
 * // As a standalone dialog
 * ```tsx
 * <CreateProjectDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleCreateProject}
 *   title="Create New Project"
 * />
 * ```
 *
 * @example
 * // With prevented navigation (e.g., in CLI auth flow)
 * ```tsx
 * <CreateProjectDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleCreateProject}
 *   preventNavigation={true}
 * />
 * ```
 */
export function CreateProjectDialog({
  open = true,
  onOpenChange,
  onSubmit,
  title = "Create New Project",
  preventNavigation = false,
}: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
    },
  });

  /**
   * Handles form submission for project creation
   * @param values - The form values containing the project name
   */
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const project = await onSubmit(values.projectName.trim());
      form.reset();

      // Only navigate to project details page after successful creation if not prevented
      if (project.id && !preventNavigation) {
        router.push(`/${project.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <DialogHeader className="mb-6">
        <motion.div variants={itemVariants}>
          <DialogTitle className="font-semibold">{title}</DialogTitle>
        </motion.div>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
          <motion.div variants={itemVariants}>
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
            <div className="space-y-1 p-2">
              <p className="text-xs text-foreground">
                Try Tambo instantly with 500 starter LLM calls. Tambo is BYO
                Model: add your own key when you’re ready to scale or experiment
                with other providers.
              </p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="pt-2">
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
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
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{formContent}</DialogContent>
    </Dialog>
  );
}
