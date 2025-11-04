"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditableHint } from "@/components/ui/editable-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { Suggestion } from "@tambo-ai/react";
import { withInteractable } from "@tambo-ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { z } from "zod";

const toolCallLimitEditorSuggestions: Suggestion[] = [
  {
    id: "fetch-tool-call-limit",
    title: "Fetch Tool Call Limit",
    detailedSuggestion: "What is the current tool call limit for this project?",
    messageId: "fetch-tool-call-limit",
  },
  {
    id: "update-tool-call-limit",
    title: "Update Tool Call Limit",
    detailedSuggestion: "Update the tool call limit for this project to 10",
    messageId: "update-tool-call-limit",
  },
  {
    id: "how-to-use-tool-call-limit",
    title: "How to Use Tool Call Limit?",
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
      "When set, the component enters edit mode with this limit value pre-filled. This allows Tambo to propose a specific tool call limit change.",
    ),
  enterEditMode: z
    .boolean()
    .optional()
    .describe(
      "When true, the component enters edit mode with the current limit value, allowing the user to modify it manually.",
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
  enterEditMode?: boolean;
  onEdited?: () => void;
}

export function ToolCallLimitEditor({
  projectId,
  maxToolCallLimit,
  editedLimit,
  enterEditMode,
  onEdited,
}: ToolCallLimitEditorProps) {
  const maxToolCallLimitId = useId();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [limitValue, setLimitValue] = useState("");

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  // Sync current value from prop (but respect ongoing edits)
  useEffect(() => {
    if (maxToolCallLimit && !isEditing) {
      setLimitValue(maxToolCallLimit.toString());
    }
  }, [maxToolCallLimit, isEditing]);

  // When Tambo sends editedLimit, enter edit mode with that value
  useEffect(() => {
    if (editedLimit !== undefined) {
      setLimitValue(editedLimit.toString());
      setIsEditing(true);
    }
  }, [editedLimit]);

  // When Tambo sends enterEditMode, enter edit mode with current value
  useEffect(() => {
    if (enterEditMode === true) {
      setLimitValue(maxToolCallLimit.toString());
      setIsEditing(true);
    }
  }, [enterEditMode, maxToolCallLimit]);

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

      setIsEditing(false);
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Tool Call Limit
          <EditableHint
            suggestions={toolCallLimitEditorSuggestions}
            description="Click to know more about how to manage the tool call limit for this project"
            componentName="Tool Call Limit"
          />
        </CardTitle>
        <CardDescription className="text-sm font-sans text-foreground">
          Set the maximum number of tool calls allowed per response. This helps
          prevent infinite loops and controls resource usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor={maxToolCallLimitId}>Maximum Tool Calls</Label>
                  <Input
                    id={maxToolCallLimitId}
                    type="number"
                    min="1"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    placeholder="Enter maximum tool calls"
                    disabled={isUpdating}
                    autoFocus
                  />
                </div>
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-current" />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="display-limit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Current Limit</p>
                    <p className="text-2xl font-bold">{maxToolCallLimit}</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-foreground">
                  When the Tambo reaches this limit, it will finish the response
                  with a message that it has reached the limit.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export const InteractableToolCallLimitEditor = withInteractable(
  ToolCallLimitEditor,
  {
    componentName: "ToolCallLimitEditor",
    description:
      "Manages the maximum number of tool calls allowed per response for a project. This helps prevent infinite loops and controls resource usage. Users can view the current limit and edit it to a new value.",
    propsSchema: InteractableToolCallLimitEditorProps,
  },
);
