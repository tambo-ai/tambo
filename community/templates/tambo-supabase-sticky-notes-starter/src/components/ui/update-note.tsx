import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

export type UpdateNoteState = {
  status: "updating" | "success" | "error" | "not-found";
  originalNote: any;
  error: string | null;
};

export const updateNoteSchema = z.object({
  id: z
    .number()
    .describe(
      "The ID number of the note to update. Extract from user's message when they mention 'note #5', 'note 5', 'ID 5', or 'the fifth note'. If user says 'update the note about groceries', you must first identify which note ID that refers to.",
    ),
  content: z
    .string()
    .min(1)
    .max(2000)
    .nullable()
    .optional()
    .describe(
      "NEW content to replace the existing note text. Only provide this if user explicitly wants to change the note's text. " +
        "Examples: 'change note 5 to say...', 'update note content to...', 'edit the text of note 3 to...'. " +
        "If user only wants to change color, leave this undefined. Include the COMPLETE new content, not partial updates.",
    ),
  color: z
    .enum(["yellow", "red", "green", "blue", "purple", "pink"])
    .nullable()
    .optional()
    .describe(
      "NEW color for the note. Only provide this if user explicitly wants to change the color. " +
        "Examples: 'make note 5 red', 'change note color to blue', 'mark as urgent' (use red). " +
        "If user only wants to change content, leave this undefined. " +
        "Color meanings: yellow=general, red=urgent/critical, green=ideas, blue=tasks, purple=creative, pink=personal.",
    ),
});

export type UpdateNoteProps = z.infer<typeof updateNoteSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * UpdateNote Component
 *
 * Tambo renders this component when user wants to update a note.
 * It updates the note in the database and shows feedback.
 */
export const UpdateNote = React.forwardRef<HTMLDivElement, UpdateNoteProps>(
  ({ id, content, color, className, ...props }, ref) => {
    const [state, setState] = useTamboComponentState<UpdateNoteState>(
      `update-note-${id}`,
      {
        status: "updating",
        originalNote: null,
        error: null,
      },
    );

    React.useEffect(() => {
      const updateNote = async () => {
        if (!state || state.status !== "updating") return;

        try {
          // First check if note exists
          const { data: existing, error: fetchError } = await supabase
            .from("notes")
            .select("*")
            .eq("id", id)
            .single();

          if (fetchError || !existing) {
            setState({
              status: "not-found",
              originalNote: null,
              error: "Note not found",
            });
            return;
          }

          const updates: any = {};
          if (content !== undefined && content !== null)
            updates.content = content;
          if (color !== undefined && color !== null) updates.color = color;

          if (Object.keys(updates).length === 0) {
            setState({
              status: "success",
              originalNote: existing,
              error: null,
            });
            return;
          }

          const { error } = await supabase
            .from("notes")
            .update(updates)
            .eq("id", id);

          if (error) throw error;

          setState({
            status: "success",
            originalNote: existing,
            error: null,
          });
        } catch (err) {
          console.error("Failed to update note:", err);
          setState({
            status: "error",
            originalNote: null,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      };

      updateNote();
    }, [id, content, color]);

    if (!state) return null;

    const colorEmojis: Record<string, string> = {
      yellow: "📝",
      red: "🔴",
      green: "💡",
      blue: "✅",
      purple: "🎨",
      pink: "💝",
    };

    return (
      <div ref={ref} className={cn("w-full max-w-md", className)} {...props}>
        {state.status === "updating" && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Updating note...</span>
          </div>
        )}

        {state.status === "success" && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-semibold">Note updated!</span>
            </div>
            <div className="text-foreground text-xs bg-card rounded-lg p-2 border border-border space-y-1">
              {content && (
                <div>
                  <span className="text-muted-foreground">New content:</span> "
                  {content}"
                </div>
              )}
              {color && (
                <div>
                  <span className="text-neutral-500">New color:</span>{" "}
                  {colorEmojis[color]} {color}
                </div>
              )}
            </div>
            <p className="text-[10px] text-neutral-500">Note ID: {id}</p>
          </div>
        )}

        {state.status === "not-found" && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Note #{id} not found. It may have been deleted.</span>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Failed to update note. Please try again.</span>
          </div>
        )}
      </div>
    );
  },
);

UpdateNote.displayName = "UpdateNote";

export default UpdateNote;
