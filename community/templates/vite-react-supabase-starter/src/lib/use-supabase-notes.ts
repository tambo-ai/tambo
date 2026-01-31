
import { useCanvasStore } from "@/lib/canvas-storage";
import { supabase } from "@/lib/supabase";
import { useEffect, useCallback } from "react";

export interface SupabaseNote {
    id: string;
    title: string | null;
    content: string;
    color: string | null;
    canvas_id: string | null;
    created_at: string;
    updated_at: string;
}

export function useSupabaseNotes() {

    const loadNotes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("sticky_notes")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Failed to load notes:", error);
                return;
            }

            if (!data || data.length === 0) return;

            const state = useCanvasStore.getState();
            let canvasId = state.activeCanvasId;

            if (!canvasId) {
                if (state.canvases.length > 0) {
                    canvasId = state.canvases[0].id;
                    state.setActiveCanvas(canvasId);
                } else {
                    const newCanvas = state.createCanvas("Notes");
                    canvasId = newCanvas.id;
                }
            }

            const existingIds = new Set(
                state.getComponents(canvasId).map((c) => c.componentId)
            );

            for (const note of data as SupabaseNote[]) {
                if (!existingIds.has(note.id)) {
                    state.addComponent(canvasId, {
                        componentId: note.id,
                        _componentType: "StickyNote",
                        _inCanvas: true,
                        canvasId,
                        id: note.id,
                        title: note.title || "",
                        content: note.content,
                        color: note.color || "neutral",
                    });
                }
            }
        } catch (err) {
            console.error("Error loading notes:", err);
        }
    }, []);

    useEffect(() => {
        loadNotes();

        const channel = supabase
            .channel("sticky_notes_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "sticky_notes" },
                (payload) => {
                    const state = useCanvasStore.getState();
                    const canvasId = state.activeCanvasId;
                    if (!canvasId) return;

                    if (payload.eventType === "INSERT") {
                        const note = payload.new as SupabaseNote;
                        const exists = state
                            .getComponents(canvasId)
                            .some((c) => c.componentId === note.id);

                        if (!exists) {
                            state.addComponent(canvasId, {
                                componentId: note.id,
                                _componentType: "StickyNote",
                                _inCanvas: true,
                                canvasId,
                                id: note.id,
                                title: note.title || "",
                                content: note.content,
                                color: note.color || "neutral",
                            });
                        }
                    } else if (payload.eventType === "UPDATE") {
                        const note = payload.new as SupabaseNote;
                        state.updateComponent(canvasId, note.id, {
                            title: note.title || "",
                            content: note.content,
                            color: note.color || "neutral",
                        });
                    } else if (payload.eventType === "DELETE") {
                        const oldNote = payload.old as { id: string };
                        state.removeComponent(canvasId, oldNote.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadNotes]);

    return { loadNotes };
}
