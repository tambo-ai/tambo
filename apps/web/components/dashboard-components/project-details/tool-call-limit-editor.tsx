"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsRow } from "@/components/ui/settings-row";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { Suggestion } from "@tambo-ai/react";
import { withTamboInteractable } from "@tambo-ai/react";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod/v3";

const COMPONENT_NAME = "ToolCallLimit";

const _toolCallLimitEditorSuggestions: Suggestion[] = [
  {
    id: "fetch-tool-call-limit",
    title: "Fetch Tool Call Limit",
    description: "Fetch Tool Call Limit",
    detailedSuggestion: "What is the current tool call limit for this project?",
    messageId: "fetch-tool-call-limit",
  },
  {
    id: "update-tool-call-limit",
    title: "Update Tool Call Limit",
    description: "Update Tool Call Limit",
    detailedSuggestion: "Update the tool call limit for this project to 100",
    messageId: "update-tool-call-limit",
  },
  {
    id: "how-to-use-tool-call-limit",
    title: "How to Use Tool Call Limit?",
    description: "How to Use Tool Call Limit?",
    detailedSuggestion: "What is the tool call limit and how to use it?",
    messageId: "how-to-use-tool-call-limit",
  },
];

export const InteractableToolCallLimitEditorProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  maxToolCallLimit: z
    .number()
    .describe("The current maximum number of tool calls allowed per response."),
  editedLimit: z
    .number()
    .optional()
    .describe(
      "When set, the component enters edit mode with this limit value pre-filled. Use cases: 1) To propose a specific limit change, set this to the desired new value (e.g., editedLimit: 2 to suggest changing to 2). 2) To enter edit mode without proposing a change (allowing the user to manually edit), set this to the current maxToolCallLimit value (e.g., if maxToolCallLimit is 10, set editedLimit: 10).",
    ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when tool call limit is successfully updated.",
    ),
});

interface ToolCallLimitEditorProps {
  projectId: string;
  maxToolCallLimit: number;
  editedLimit?: number;
  onEdited?: () => void;
}

export function ToolCallLimitEditor({
  projectId,
  maxToolCallLimit,
  editedLimit,
  onEdited,
}: ToolCallLimitEditorProps) {
  const maxToolCallLimitId = useId();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [limitValue, setLimitValue] = useState("");

  // Track previous editedLimit to prevent unnecessary re-triggers
  const prevEditedLimitRef = useRef<number | undefined>(undefined);
  // Track if we just saved to prevent useEffect from resetting to old prop value
  const justSavedRef = useRef(false);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  // Sync current value from prop (but respect ongoing edits and just-saved state)
  useEffect(() => {
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    if (maxToolCallLimit && !isEditing) {
      setLimitValue(maxToolCallLimit.toString());
    }
  }, [maxToolCallLimit, isEditing]);

  // When Tambo sends editedLimit, enter edit mode with that value
  useEffect(() => {
    if (editedLimit != null && editedLimit !== prevEditedLimitRef.current) {
      prevEditedLimitRef.current = editedLimit;
      setLimitValue(editedLimit.toString());
      setIsEditing(true);
    }
  }, [editedLimit]);

  const handleSave = async () => {
    const limit = parseInt(limitValue);

    if (isNaN(limit) || limit < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProject({
        projectId,
        maxToolCallLimit: limit,
      });

      toast({
        title: "Success",
        description: "Tool call limit updated successfully",
      });

      // Mark as just saved to prevent useEffect from resetting limitValue to old prop
      justSavedRef.current = true;
      setIsEditing(false);
      // Reset ref so Tambo can trigger the same action again later
      prevEditedLimitRef.current = undefined;
      onEdited?.();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update tool call limit",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setLimitValue(maxToolCallLimit.toString());
    setIsEditing(false);
    // Reset ref so Tambo can trigger the same action again later
    prevEditedLimitRef.current = undefined;
  };

  return (
    <SettingsRow
      label="Tool call limit"
      description="Maximum number of tool calls allowed per response. Prevents infinite loops and controls resource usage."
      htmlFor={isEditing ? maxToolCallLimitId : undefined}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            id={maxToolCallLimitId}
            type="number"
            min="1"
            value={limitValue}
            onChange={(e) => setLimitValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
            disabled={isUpdating}
            autoFocus
            className="w-20 text-right tabular-nums"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tabular-nums">{limitValue}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      )}
    </SettingsRow>
  );
}

export const InteractableToolCallLimitEditor = withTamboInteractable(
  ToolCallLimitEditor,
  {
    componentName: COMPONENT_NAME,
    description:
      "Manages the maximum number of tool calls allowed per response for a project. This helps prevent infinite loops and controls resource usage. Users can view the current limit and edit it to a new value.",
    propsSchema: InteractableToolCallLimitEditorProps,
  },
);
