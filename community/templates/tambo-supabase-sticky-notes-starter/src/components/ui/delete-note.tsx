import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

export type DeleteNoteState = {
  status: "deleting" | "success" | "error" | "not-found";
  deletedNote: any;
  error: string | null;
};

export const deleteNoteSchema = z.object({
  id: z
    .number()
    .describe(
      "The ID number of the note to delete. Extract from user's message when they say: " +
        "'delete note 5', 'remove note #3', 'delete the note with ID 7', 'get rid of note 2'. " +
        "If user refers to a note by its content (e.g., 'delete the grocery note'), you must first identify which note ID that is. " +
        "The ID is displayed on each note card.",
    ),
});

export type DeleteNoteProps = z.infer<typeof deleteNoteSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * DeleteNote Component
 *
 * Tambo renders this component when user wants to delete a note.
 * It deletes the note from the database and shows confirmation.
 */
export const DeleteNote = React.forwardRef<HTMLDivElement, DeleteNoteProps>(
  ({ id, className, ...props }, ref) => {
    const [state, setState] = useTamboComponentState<DeleteNoteState>(
      `delete-note-${id}`,
      {
        status: "deleting",
        deletedNote: null,
        error: null,
      },
    );

    React.useEffect(() => {
      const deleteNote = async () => {
        if (!state || state.status !== "deleting") return;

        try {
          const { data: existing, error: fetchError } = await supabase
            .from("notes")
            .select("*")
            .eq("id", id)
            .single();

          if (fetchError || !existing) {
            setState({
              status: "not-found",
              deletedNote: null,
              error: "Note not found",
            });
            return;
          }

          const { error } = await supabase.from("notes").delete().eq("id", id);

          if (error) throw error;

          setState({
            status: "success",
            deletedNote: existing,
            error: null,
          });
        } catch (err) {
          console.error("Failed to delete note:", err);
          setState({
            status: "error",
            deletedNote: null,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      };

      deleteNote();
    }, [id]);

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
        {state.status === "deleting" && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Deleting note...</span>
          </div>
        )}

        {state.status === "success" && state.deletedNote && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-orange-400">
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="font-semibold">Note deleted!</span>
            </div>
            <div className="text-foreground text-xs bg-card rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2">
                <span>{colorEmojis[state.deletedNote.color]}</span>
                <span className="line-clamp-1">
                  "{state.deletedNote.content}"
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Deleted note ID: {id}
            </p>
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
            <span>Note #{id} not found. It may have already been deleted.</span>
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
            <span>Failed to delete note. Please try again.</span>
          </div>
        )}
      </div>
    );
  },
);

DeleteNote.displayName = "DeleteNote";

export default DeleteNote;
