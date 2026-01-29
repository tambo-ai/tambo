import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

export type CreateNoteState = {
  status: "creating" | "success" | "error";
  noteData: {
    id: number;
    content: string;
    color: string;
  } | null;
  error: string | null;
};

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      "Extract the FULL note content from user's message. Include everything they want to save - tasks, ideas, reminders, or notes. Preserve formatting, bullet points, and line breaks. Examples: 'Buy groceries: milk, eggs, bread', 'Meeting notes: Q1 review, budget discussion', 'Idea: Build a mobile app for productivity'",
    ),
  color: z
    .enum(["yellow", "red", "green", "blue", "purple", "pink"])
    .describe(
      "Intelligently choose color based on content context and urgency: " +
        "yellow=general notes, daily tasks, neutral content; " +
        "red=URGENT, ASAP, critical, important, high-priority, deadlines, warnings; " +
        "green=ideas, brainstorming, creative thoughts, suggestions, positive outcomes; " +
        "blue=tasks, to-dos, action items, work-related, meetings, projects; " +
        "purple=creative work, design, visual projects, artistic ideas, aesthetic notes; " +
        "pink=personal notes, private thoughts, casual reminders, relationships, self-care. " +
        "If user explicitly mentions a color (e.g., 'create a red note'), use that color. " +
        "Otherwise, intelligently infer from context and keywords.",
    ),
});

export type CreateNoteProps = z.infer<typeof createNoteSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * CreateNote Component
 *
 * Tambo renders this component when user wants to create a note.
 * It saves to the database and shows creation feedback.
 */
export const CreateNote = React.forwardRef<HTMLDivElement, CreateNoteProps>(
  ({ content, color, className, ...props }, ref) => {
    const [state, setState] = useTamboComponentState<CreateNoteState>(
      `create-note-${content.slice(0, 20)}`,
      {
        status: "creating",
        noteData: null,
        error: null,
      },
    );

    React.useEffect(() => {
      const createNote = async () => {
        if (!state || state.status !== "creating") return;

        try {
          const canvasWidth =
            window.innerWidth > 768
              ? window.innerWidth - 600
              : window.innerWidth;
          const canvasHeight = window.innerHeight - 100; 

          const safeX = Math.min(
            Math.max(50, Math.random() * (canvasWidth - 450)),
            canvasWidth - 420,
          );
          const safeY = Math.min(
            Math.max(50, Math.random() * (canvasHeight - 350)),
            canvasHeight - 320,
          );

          const { data, error } = await supabase
            .from("notes")
            .insert({
              content,
              color,
              x: safeX,
              y: safeY,
            })
            .select()
            .single();

          if (error) throw error;

          setState({
            status: "success",
            noteData: data,
            error: null,
          });
        } catch (err) {
          console.error("Failed to create note:", err);
          setState({
            status: "error",
            noteData: null,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      };

      createNote();
    }, [content, color]);

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
        {state.status === "creating" && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Creating note...</span>
          </div>
        )}

        {state.status === "success" && state.noteData && (
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
              <span className="font-semibold">Note created!</span>
            </div>
            <div className="text-foreground text-xs bg-card rounded-lg p-2 border border-border">
              <div className="flex items-center gap-2">
                <span>{colorEmojis[state.noteData.color]}</span>
                <span className="line-clamp-2">"{state.noteData.content}"</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Note ID: {state.noteData.id}
            </p>
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
            <span>Failed to create note. Please try again.</span>
          </div>
        )}
      </div>
    );
  },
);

CreateNote.displayName = "CreateNote";

export default CreateNote;
