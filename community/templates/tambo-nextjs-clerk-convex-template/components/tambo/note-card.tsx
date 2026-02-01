"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const noteCardSchema = z.object({
  id: z.string().describe("The note ID"),
  title: z.string().describe("The note title"),
  content: z.string().describe("The note content"),
  pinned: z
    .boolean()
    .nullable()
    .optional()
    .default(false)
    .describe("Whether the note is pinned"),
  archived: z
    .boolean()
    .nullable()
    .optional()
    .default(false)
    .describe("Whether the note is archived"),
  showActions: z
    .boolean()
    .nullable()
    .optional()
    .default(true)
    .describe("Whether to show action buttons"),
});

export type NoteCardProps = z.infer<typeof noteCardSchema> & {
  onEdit?: () => void;
};

/** Single white/default style for all notes (no colored variants). */
const cardStyle = "bg-card hover:bg-accent/50";

export function NoteCard({
  id,
  title,
  content,
  pinned,
  archived,
  showActions,
  onEdit,
}: NoteCardProps) {
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const normalizedPinned = pinned ?? false;
  const normalizedArchived = archived ?? false;
  const normalizedShowActions = showActions ?? true;

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateNote({ id: id as Id<"notes">, pinned: !normalizedPinned });
      toast.success(normalizedPinned ? "Note unpinned" : "Note pinned");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateNote({
        id: id as Id<"notes">,
        archived: !normalizedArchived,
      });
      toast.success(normalizedArchived ? "Note restored" : "Note archived");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNote({ id: id as Id<"notes"> });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <Card
      onClick={onEdit}
      className={cn(
        "group relative transition-all duration-200 border border-gray-200 bg-white shadow-sm hover:shadow-md cursor-pointer",
        cardStyle,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 flex-1">
            {title}
          </h3>
          {normalizedPinned && (
            <Pin className="h-3.5 w-3.5 text-muted-foreground shrink-0 fill-current" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>

        {normalizedShowActions && (
          <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePin}
              title={normalizedPinned ? "Unpin" : "Pin"}
            >
              <Pin
                className={cn(
                  "h-3.5 w-3.5",
                  normalizedPinned && "fill-current",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleArchive}
              title={normalizedArchived ? "Unarchive" : "Archive"}
            >
              {normalizedArchived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
