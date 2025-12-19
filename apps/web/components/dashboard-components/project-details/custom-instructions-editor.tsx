import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { withInteractable, type Suggestion } from "@tambo-ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod/v3";

const COMPONENT_NAME = "CustomInstructions";

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
  editedAllowSystemPromptOverride: z
    .boolean()
    .optional()
    .describe(
      "The edited value for the system prompt override setting. When set along with editedValue, this will be staged in edit mode and saved together with the instructions.",
    ),
});

export interface CustomInstructionsEditorProps {
  projectId: string;
  customInstructions?: string | null;
  allowSystemPromptOverride?: boolean | null;
  editedValue?: string;
  editedAllowSystemPromptOverride?: boolean;
  onEdited?: () => void;
}

export function CustomInstructionsEditor({
  projectId,
  customInstructions,
  allowSystemPromptOverride: allowSystemPromptOverrideProp,
  editedValue,
  editedAllowSystemPromptOverride,
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
  const [savedToggleValue, setSavedToggleValue] = useState<boolean | undefined>(
    allowSystemPromptOverrideProp === undefined
      ? undefined
      : Boolean(allowSystemPromptOverrideProp),
  );
  const [hasEditedToggle, setHasEditedToggle] = useState(false);
  // Track if we just saved to prevent useEffect from resetting to old prop value
  const justSavedRef = useRef(false);

  // Separate mutations to prevent state interference
  const updateInstructions = api.project.updateProject.useMutation();
  const updateToggle = api.project.updateProject.useMutation();

  // Update the saved value when props change (e.g., after loading or Tambo updates)
  // Only sync if not currently editing and not just saved to avoid overwriting unsaved changes
  useEffect(() => {
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    if (customInstructions !== undefined && !isEditing) {
      setSavedValue(customInstructions ?? "");
      setDisplayValue(customInstructions ?? "");
    }
  }, [customInstructions, isEditing]);

  // Sync toggle state from props (no auto-save, just state sync)
  useEffect(() => {
    if (justSavedRef.current) {
      return;
    }
    if (allowSystemPromptOverrideProp !== undefined && !isEditing) {
      setAllowSystemPromptOverride(Boolean(allowSystemPromptOverrideProp));
      setSavedToggleValue(Boolean(allowSystemPromptOverrideProp));
    }
  }, [allowSystemPromptOverrideProp, isEditing]);

  // When Tambo sends a new editedValue, enter edit mode automatically
  useEffect(() => {
    if (editedValue) {
      setDisplayValue(editedValue);
      setIsEditing(true);
    }
  }, [editedValue]);

  // When Tambo sends a new editedAllowSystemPromptOverride, stage it for saving
  useEffect(() => {
    if (editedAllowSystemPromptOverride !== undefined) {
      setAllowSystemPromptOverride(editedAllowSystemPromptOverride);
      setHasEditedToggle(true);
      setIsEditing(true);
    }
  }, [editedAllowSystemPromptOverride]);

  const updateAllowOverride = (val: boolean) => {
    // If in edit mode, just update local state (will be saved with instructions)
    if (isEditing) {
      setAllowSystemPromptOverride(val);
      setHasEditedToggle(true);
      return;
    }

    // Otherwise, save immediately
    setAllowSystemPromptOverride(val);
    updateToggle.mutate(
      {
        projectId,
        allowSystemPromptOverride: Boolean(val),
      },
      {
        onSuccess: () => {
          setSavedToggleValue(Boolean(val));
          if (onEdited) onEdited();
        },
        onError: () => {
          setAllowSystemPromptOverride(savedToggleValue);
        },
      },
    );
  };

  const handleSave = () => {
    const updatePayload: {
      projectId: string;
      customInstructions: string;
      allowSystemPromptOverride?: boolean;
    } = {
      projectId,
      customInstructions: displayValue,
    };

    // Include toggle update if it was changed during edit mode
    if (hasEditedToggle) {
      updatePayload.allowSystemPromptOverride = Boolean(
        allowSystemPromptOverride,
      );
    }

    updateInstructions.mutate(updatePayload, {
      onSuccess: () => {
        setSavedValue(displayValue);
        if (hasEditedToggle) {
          setSavedToggleValue(Boolean(allowSystemPromptOverride));
        }
        // Mark as just saved to prevent useEffect from resetting to old prop values
        justSavedRef.current = true;
        setIsEditing(false);
        setHasEditedToggle(false);
        toast({
          title: "Saved",
          description: hasEditedToggle
            ? "Custom instructions and settings updated successfully"
            : "Custom instructions updated successfully",
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
    });
  };

  const handleCancel = () => {
    setDisplayValue(savedValue);
    setAllowSystemPromptOverride(savedToggleValue);
    setHasEditedToggle(false);
    setIsEditing(false);
  };

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Custom Instructions
          <EditWithTamboButton description="Edit custom instructions and system prompt override settings" />
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
                {savedValue ? (
                  <motion.div
                    key="display-instructions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 whitespace-pre-wrap rounded-md text-sm"
                  >
                    {savedValue}
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
                    {savedValue ? "Edit Instructions" : "Add Instructions"}
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
    componentName: COMPONENT_NAME,
    description:
      "A component that allows users to edit custom instructions for their AI assistant project. Users can toggle edit mode, update the custom instructions text, and control whether system prompts can override these instructions.",
    propsSchema: InteractableCustomInstructionsEditorProps,
  },
);
