import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const notesList = notes.map(note => `${note.note} (${note.createdAt.toLocaleDateString()})`).join('\n');
    return NextResponse.json({ message: notesList });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
