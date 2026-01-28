import { deleteNote, getUserNotes, initDatabase, saveNote } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 },
            );
        }

        await initDatabase();

        const note = await saveNote(userId, content);

        return NextResponse.json({
            id: note.id,
            content: note.content,
            created_at: note.created_at.toISOString(),
            message: "Note saved successfully",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to save note", details: String(error) },
            { status: 500 },
        );
    }
}

export async function GET(): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await initDatabase();

        const notes = await getUserNotes(userId);

        return NextResponse.json({
            notes: notes.map((note) => ({
                id: note.id,
                content: note.content,
                created_at: note.created_at.toISOString(),
            })),
            count: notes.length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch notes", details: String(error) },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get("id");

        if (!noteId) {
            return NextResponse.json(
                { error: "Note ID is required" },
                { status: 400 },
            );
        }

        await initDatabase();

        await deleteNote(parseInt(noteId, 10), userId);

        return NextResponse.json({ message: "Note deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete note", details: String(error) },
            { status: 500 },
        );
    }
}
