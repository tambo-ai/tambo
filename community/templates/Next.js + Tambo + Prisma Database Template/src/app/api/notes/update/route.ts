import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { id, note, content } = await request.json();
    
    const updatedNote = await prisma.note.update({
      where: { id },
      data: { note, content }
    });
    
    return NextResponse.json({ message: `Updated note: ${updatedNote.note}` });
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}
