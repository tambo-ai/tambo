import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { note, content } = await request.json();
    
    const newNote = await prisma.note.create({
      data: { note, content }
    });
    
    return NextResponse.json({ message: `Created note: ${newNote.note}` });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
