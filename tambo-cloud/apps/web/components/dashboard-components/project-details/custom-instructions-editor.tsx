import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

export const CustomInstructionsEditorSchema = z.object({
  id: z.string().describe("The unique identifier for the project."),
  name: z.string().describe("The name of the project."),
  customInstructions: z
    .string()
    .nullable()
    .optional()
    .describe("Custom instructions for the AI assistant."),
});

export const CustomInstructionsEditorProps = z.object({
  project: CustomInstructionsEditorSchema.optional().describe(
    "The project to edit custom instructions for.",
  ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when instructions are successfully updated.",
    ),
});

interface CustomInstructionsEditorProps {
  project?: { id: string; name: string; customInstructions?: string | null };
  onEdited?: () => void;
}

export function CustomInstructionsEditor({
  project,
  onEdited,
}: CustomInstructionsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customInstructions, setCustomInstructions] = useState(
    project?.customInstructions || "",
  );

  // Update the instructions when the project changes (e.g., after loading)
  useEffect(() => {
    if (project?.customInstructions !== undefined) {
      setCustomInstructions(project.customInstructions || "");
    }
  }, [project?.customInstructions]);

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      // Call the onEdited callback to refresh the project data
      if (onEdited) {
        onEdited();
      }
    },
  });

  const handleSave = async () => {
    if (!project) return;

    updateProject.mutate({
      projectId: project.id,
      customInstructions,
    });
  };

  const handleCancel = () => {
    setCustomInstructions(project?.customInstructions || "");
    setIsEditing(false);
  };

  // If project is undefined, show a loading state
  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-heading font-semibold">
                Custom Instructions
              </CardTitle>
              <div className="h-3 w-80 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[150px] space-y-3 animate-pulse">
            <div className="min-h-[100px] rounded-md border border-muted bg-muted/50 p-3 space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-[80%] bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-heading font-semibold">
              Custom Instructions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              These instructions are added to each conversation and help guide
              AI responses.
            </CardDescription>
          </div>
          <AnimatePresence mode="wait">
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="font-sans"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[150px] relative">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-3"
              >
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add custom instructions for your project..."
                  className="min-h-[200px] w-full"
                  autoFocus
                />
                <motion.div
                  className="flex gap-2 justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
                    onClick={handleCancel}
                    disabled={updateProject.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="font-sans"
                    onClick={handleSave}
                    disabled={updateProject.isPending}
                  >
                    {updateProject.isPending ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Save className="h-3 w-3" />
                        Save
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="display-instructions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="min-h-[100px] whitespace-pre-wrap rounded-md border border-muted bg-muted/50 p-3 text-sm"
              >
                {project.customInstructions || "No custom instructions set."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
