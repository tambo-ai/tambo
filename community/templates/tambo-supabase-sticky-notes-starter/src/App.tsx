import { useEffect, useState } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "./components/tambo";
import { supabase } from "./lib/supabase";
import { components } from "./lib/tambo";
import { StickyNote } from "./interactables/components/StickyNote";
import "./index.css";

type Note = {
  id: number;
  content: string;
  color: string;
  x: number;
  y: number;
  created_at: string;
};

export default function App() {
  const tamboKey = import.meta.env.VITE_TAMBO_KEY;
  const [showCanvas, setShowCanvas] = useState(false);

  return (
    <TamboProvider apiKey={tamboKey} components={components}>
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="md:hidden bg-card border-b p-2 flex gap-2">
          <button
            onClick={() => setShowCanvas(false)}
            className={`flex-1 px-4 py-2 rounded font-medium ${!showCanvas ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setShowCanvas(true)}
            className={`flex-1 px-4 py-2 rounded font-medium ${showCanvas ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Canvas
          </button>
        </div>

        <div className="flex h-full overflow-hidden">
          <div
            className={`w-full md:w-[600px] overflow-hidden border-r ${showCanvas ? "hidden md:block" : ""}`}
          >
            <MessageThreadFull />
          </div>
          <div
            className={`flex-1 overflow-hidden ${showCanvas ? "" : "hidden md:block"}`}
          >
            <StickyNotesCanvas />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}



function StickyNotesCanvas() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    supabase
      .from("notes")
      .select("*")
      .order("id", { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data);
      });

    const channel = supabase
      .channel("notes-changes", { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const newNote = payload.new as Note;
          setNotes((prev) =>
            prev.some((n) => n.id === newNote.id) ? prev : [newNote, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === (payload.new as Note).id ? (payload.new as Note) : n,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        (payload) => {
          const deletedId = (payload.old as Note).id;
          setNotes((prev) => prev.filter((n) => n.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, oklch(0.73 0.022 260) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative h-full w-full overflow-hidden">
        {notes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="text-center text-muted-foreground">
              <div className="inline-flex p-6 bg-card/90 rounded-3xl mb-4 backdrop-blur-sm border border-border">
                <svg
                  className="w-12 h-12 md:w-20 md:h-20 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <p className="text-sm md:text-base font-semibold text-foreground">
                Tambo x Supabase Sticky Notes Starter Template
              </p>
              <p className="text-xs md:text-sm mt-2 text-muted-foreground">
                Create notes with Tambo AI{" "}
                <span className="hidden md:inline">→</span>
              </p>
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <StickyNote
              key={note.id}
              id={note.id}
              content={note.content}
              color={
                note.color as
                  | "yellow"
                  | "red"
                  | "green"
                  | "blue"
                  | "purple"
                  | "pink"
              }
              x={note.x}
              y={note.y}
            />
          ))
        )}
      </div>
    </div>
  );
}
