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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateProjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (projectName: string) => Promise<{ id: string }>;
  onBack?: () => void;
  embedded?: boolean;
  title?: string;
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

export function CreateProjectDialog({
  open = true,
  onOpenChange,
  onSubmit,
  onBack,
  embedded = false,
  title = "Create New Project",
}: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const project = await onSubmit(values.projectName.trim());
      form.reset();

      // Navigate to project details page after successful creation
      if (project.id) {
        router.push(`/dashboard/${project.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      {!embedded && (
        <DialogHeader className="mb-6">
          <motion.div variants={itemVariants}>
            <DialogTitle className="font-semibold">{title}</DialogTitle>
          </motion.div>
        </DialogHeader>
      )}
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
                Start with 500 free messages, after that you can add your own
                LLM Provider Key from the project settings.
              </p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="pt-2">
            <DialogFooter>
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {!embedded && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange?.(false)}
                >
                  Cancel
                </Button>
              )}
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

  if (embedded) {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{formContent}</DialogContent>
    </Dialog>
  );
}
