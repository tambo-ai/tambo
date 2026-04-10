import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { withTamboInteractable, type Suggestion } from "@tambo-ai/react";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod/v3";

const COMPONENT_NAME = "CustomInstructions";

const _customInstructionsEditorSuggestions: Suggestion[] = [
  {
    id: "add-custom-instructions",
    title: "Add Custom Instructions",
    description: "Add Custom Instructions",
    detailedSuggestion: "Add custom instructions to the project",
    messageId: "add-custom-instructions",
  },
  {
    id: "edit-custom-instructions",
    title: "Edit Custom Instructions",
    description: "Edit Custom Instructions",
    detailedSuggestion: "Make the custom instructions more detailed",
    messageId: "edit-custom-instructions",
  },
  {
    id: "update-prompt-to-greet-with-howdy",
    title: "Update Prompt to Greet with Howdy",
    description: "Update Prompt to Greet with Howdy",
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
  editedValue: z
    .string()
    .optional()
    .describe(
      "The value to overwrite the current custom instructions field with. When set, the component will be in 'editing mode' where the user can save this updated value or cancel it.",
    ),
});

export interface CustomInstructionsEditorProps {
  projectId: string;
  customInstructions?: string | null;
  editedValue?: string;
  onEdited?: () => void;
}

export function CustomInstructionsEditor({
  projectId,
  customInstructions,
  editedValue,
  onEdited,
}: CustomInstructionsEditorProps) {
  const customInstructionsId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [savedValue, setSavedValue] = useState(customInstructions ?? "");
  const [displayValue, setDisplayValue] = useState(customInstructions ?? "");
  const { toast } = useToast();
  const justSavedRef = useRef(false);

  const updateInstructions = api.project.updateProject.useMutation();

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

  useEffect(() => {
    if (editedValue) {
      setDisplayValue(editedValue);
      setIsEditing(true);
    }
  }, [editedValue]);

  const handleSave = () => {
    updateInstructions.mutate(
      {
        projectId,
        customInstructions: displayValue,
      },
      {
        onSuccess: () => {
          setSavedValue(displayValue);
          justSavedRef.current = true;
          setIsEditing(false);
          toast({
            title: "Saved",
            description: "Custom instructions updated successfully",
          });
          onEdited?.();
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
    <div className="space-y-3">
      <Textarea
        id={customInstructionsId}
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          if (!isEditing) setIsEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        }}
        placeholder="Add custom instructions for your project..."
        className="min-h-[150px] w-full"
      />
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateInstructions.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateInstructions.isPending}
          >
            {updateInstructions.isPending && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {updateInstructions.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

export const InteractableCustomInstructionsEditor = withTamboInteractable(
  CustomInstructionsEditor,
  {
    componentName: COMPONENT_NAME,
    description:
      "A component that allows users to edit custom instructions for their AI assistant project. Users can toggle edit mode and update the custom instructions text.",
    propsSchema: InteractableCustomInstructionsEditorProps,
  },
);
