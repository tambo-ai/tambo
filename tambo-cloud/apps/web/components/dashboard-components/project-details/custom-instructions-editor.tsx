import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditableHint } from "@/components/ui/editable-hint";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { withInteractable, type Suggestion } from "@tambo-ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { z } from "zod";

const customInstructionsEditorSuggestions: Suggestion[] = [
  {
    id: "add-custom-instructions",
    title: "Add Custom Instructions",
    detailedSuggestion: "Add custom instructions to the project",
    messageId: "add-custom-instructions",
  },
  {
    id: "edit-custom-instructions",
    title: "Edit Custom Instructions",
    detailedSuggestion: "Make the custom instructions more detailed",
    messageId: "edit-custom-instructions",
  },
  {
    id: "update-prompt-to-greet-with-howdy",
    title: "Update Prompt to Greet with Howdy",
    detailedSuggestion: "Update the prompt to always greet with howdy",
    messageId: "update-prompt-to-greet-with-howdy",
  },
];

export const InteractableCustomInstructionsEditorProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  customInstructions: z
    .string()
    .nullable()
    .optional()
    .describe("The current custom instructions for the AI assistant."),
  allowSystemPromptOverride: z
    .boolean()
    .nullable()
    .optional()
    .describe(
      "Current setting: when enabled, a system message passed from client-side initialMessages will override custom instructions.",
    ),
  editedValue: z
    .string()
    .optional()
    .describe(
      "The value to overwrite the current custom instructions field with. When set, the component will be in 'editing mode' where the user can save this updated value or cancel it.",
    ),
});

interface CustomInstructionsEditorProps {
  projectId: string;
  customInstructions?: string | null;
  allowSystemPromptOverride?: boolean | null;
  editedValue?: string;
  onEdited?: () => void;
}

export function CustomInstructionsEditor({
  projectId,
  customInstructions,
  allowSystemPromptOverride: allowSystemPromptOverrideProp,
  editedValue,
  onEdited,
}: CustomInstructionsEditorProps) {
  const customInstructionsId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [savedValue, setSavedValue] = useState(customInstructions ?? "");
  const [displayValue, setDisplayValue] = useState(customInstructions ?? "");
  const { toast } = useToast();
  const [allowSystemPromptOverride, setAllowSystemPromptOverride] = useState<
    boolean | undefined
  >(
    allowSystemPromptOverrideProp === undefined
      ? undefined
      : Boolean(allowSystemPromptOverrideProp),
  );

  // Separate mutations to prevent state interference
  const updateInstructions = api.project.updateProject.useMutation();
  const updateToggle = api.project.updateProject.useMutation();

  // Update the saved value when props change (e.g., after loading or Tambo updates)
  // Only sync if not currently editing to avoid overwriting unsaved changes
  useEffect(() => {
    if (customInstructions !== undefined && !isEditing) {
      setSavedValue(customInstructions ?? "");
      setDisplayValue(customInstructions ?? "");
    }
  }, [customInstructions, isEditing]);

  // Sync toggle state from props (no auto-save, just state sync)
  useEffect(() => {
    if (allowSystemPromptOverrideProp !== undefined) {
      setAllowSystemPromptOverride(Boolean(allowSystemPromptOverrideProp));
    }
  }, [allowSystemPromptOverrideProp]);

  // When Tambo sends a new editedValue, enter edit mode automatically
  useEffect(() => {
    if (editedValue !== undefined) {
      setDisplayValue(editedValue);
      setIsEditing(true);
    }
  }, [editedValue]);

  const updateAllowOverride = (val: boolean) => {
    // Optimistically update local state
    setAllowSystemPromptOverride(val);

    // Save to backend (no toast)
    updateToggle.mutate(
      {
        projectId,
        allowSystemPromptOverride: Boolean(val),
      },
      {
        onSuccess: () => {
          if (onEdited) onEdited();
        },
        onError: () => {
          // Revert on error
          setAllowSystemPromptOverride(Boolean(allowSystemPromptOverrideProp));
        },
      },
    );
  };

  const handleSave = () => {
    updateInstructions.mutate(
      {
        projectId,
        customInstructions: displayValue,
      },
      {
        onSuccess: () => {
          setSavedValue(displayValue);
          setIsEditing(false);
          toast({
            title: "Saved",
            description: "Custom instructions updated successfully",
          });
          if (onEdited) {
            onEdited();
          }
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update custom instructions",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleCancel = () => {
    setDisplayValue(savedValue);
    setIsEditing(false);
  };

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Custom Instructions
          <EditableHint
            suggestions={customInstructionsEditorSuggestions}
            description="Click to know more about how to manage the custom instructions for this project"
            componentName="Custom Instructions"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="text-sm font-medium">
              Allow system prompt override
            </div>
            <div className="text-sm text-foreground">
              When enabled, a system message passed from client-side
              initialMessages will override custom instructions.
            </div>
          </div>
          <div className="flex items-center">
            <Switch
              checked={!!allowSystemPromptOverride}
              onCheckedChange={(val) => updateAllowOverride(Boolean(val))}
              aria-label="Allow system prompt override"
            />
          </div>
        </div>

        <div className="relative">
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
                <CardDescription className="text-sm text-foreground mb-4">
                  These instructions are added to each conversation to guide
                  tambo&apos;s responses.
                </CardDescription>
                <Label htmlFor={customInstructionsId}>Instructions</Label>
                <Textarea
                  id={customInstructionsId}
                  value={displayValue}
                  onChange={(e) => setDisplayValue(e.target.value)}
                  placeholder="Add custom instructions for your project..."
                  className="min-h-[200px] w-full"
                  autoFocus
                />
                <motion.div
                  className="flex gap-2 justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateInstructions.isPending}
                  >
                    {updateInstructions.isPending ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span>Save Instructions</span>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-sans bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    onClick={handleCancel}
                    disabled={updateInstructions.isPending}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="flex justify-between items-start">
                {customInstructions ? (
                  <motion.div
                    key="display-instructions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 whitespace-pre-wrap rounded-md text-sm"
                  >
                    {customInstructions}
                  </motion.div>
                ) : (
                  <CardDescription className="text-sm text-foreground">
                    These instructions are added to each conversation to guide
                    tambo&apos;s responses.
                  </CardDescription>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
                    onClick={() => setIsEditing(true)}
                  >
                    {customInstructions
                      ? "Edit Instructions"
                      : "Add Instructions"}
                  </Button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export const InteractableCustomInstructionsEditor = withInteractable(
  CustomInstructionsEditor,
  {
    componentName: "InstructionsEditor",
    description:
      "A component that allows users to edit custom instructions for their AI assistant project. Users can toggle edit mode, update the custom instructions text, and control whether system prompts can override these instructions.",
    propsSchema: InteractableCustomInstructionsEditorProps,
  },
);
