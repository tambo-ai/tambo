import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import * as React from "react";
import { z } from "zod";

/**
 * StickyNote Schema for Tambo AI 
 */
export const stickyNoteSchema = z.object({
    title: z.string().describe("The title/heading of the sticky note"),
    content: z.string().describe("The main content/body of the sticky note"),
    color: z
        .enum(["default", "accent", "muted"])
        .optional()
        .default("default")
        .describe("Note style - default (neutral), accent (#80FFCE), or muted"),
});

export type StickyNoteProps = z.infer<typeof stickyNoteSchema> & {
    id?: string;
    createdAt?: string;
    className?: string;
    onUpdate?: (id: string, title: string, content: string) => void;
    onDelete?: (id: string) => void;
};

export type StickyNoteState = {
    isEditing: boolean;
    editTitle: string;
    editContent: string;
};

export const StickyNote = React.forwardRef<HTMLDivElement, StickyNoteProps>(
    ({ id, title, content, color = "default", createdAt, className, onUpdate, onDelete }, ref) => {
        const [stableId] = React.useState(() => id || `note-${Date.now()}`);

        const [state, setState] = useTamboComponentState<StickyNoteState>(
            `sticky-note-${stableId}`,
            { isEditing: false, editTitle: title, editContent: content }
        );

        React.useEffect(() => {
            if (!state?.isEditing) {
                setState({ ...state!, editTitle: title, editContent: content });
            }
        }, [title, content, state, setState]);

        const accentStyles = {
            default: "border-t-gray-200",
            accent: "border-t-[#80FFCE]",
            muted: "border-t-gray-100",
        };

        const handleStartEdit = (e: React.MouseEvent) => {
            e.stopPropagation();
            setState({ isEditing: true, editTitle: title, editContent: content });
        };

        const handleCancelEdit = () => {
            setState({ isEditing: false, editTitle: title, editContent: content });
        };

        const handleSaveEdit = () => {
            if (state && onUpdate) {
                onUpdate(stableId, state.editTitle, state.editContent);
            }
            setState({ ...state!, isEditing: false });
        };

        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onDelete) {
                onDelete(stableId);
            }
        };

        const formatDate = (dateStr?: string) => {
            const date = dateStr ? new Date(dateStr) : new Date();
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        };

        return (
            <div
                ref={ref}
                data-note-id={stableId}
                className={cn(
                    "group relative",
                    "bg-white rounded-lg",
                    "border border-gray-100 border-t-2",
                    accentStyles[color],
                    "w-full",
                    "hover:border-gray-200",
                    "transition-colors duration-150",
                    className
                )}
            >
                <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!state?.isEditing && (
                        <>
                            <button
                                onClick={handleStartEdit}
                                className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors"
                                title="Edit"
                            >
                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 rounded-md bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                            </button>
                        </>
                    )}
                </div>

                <div className="p-4">
                    {state?.isEditing ? (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={state.editTitle}
                                onChange={(e) => setState({ ...state, editTitle: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                                placeholder="Title"
                                autoFocus
                            />
                            <textarea
                                value={state.editContent}
                                onChange={(e) => setState({ ...state, editContent: e.target.value })}
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 resize-y min-h-[80px]"
                                placeholder="Content"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors flex items-center gap-1"
                                >
                                    <Check className="h-3 w-3" />
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {title && (
                                <h3 className="font-semibold text-[14px] text-gray-800 mb-2 pr-16 leading-snug">
                                    {title}
                                </h3>
                            )}

                            <p className="text-[13px] text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                                {content}
                            </p>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                <span className="text-[10px] text-gray-300 font-mono">
                                    #{stableId.slice(-8)}
                                </span>
                                <span className="text-[10px] text-gray-300">
                                    {formatDate(createdAt)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
);

StickyNote.displayName = "StickyNote";
export default StickyNote;
