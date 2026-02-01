'use client';

import { TamboProvider } from '@tambo-ai/react';
import { MessageThread } from '@/components/message-thread';
import { NotesList } from '@/components/notes-list';
import { tools } from '@/lib/tambo';

function HomePage() {
  const handleNotesUpdate = () => {
    // Trigger notes refresh
    const refreshNotes = (window as { refreshNotes?: () => void }).refreshNotes;
    if (refreshNotes) {
      refreshNotes();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tambo + Prisma Database Starter
          </h1>
          <p className="text-muted-foreground">
            AI-powered note management with Prisma and SQLite
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-lg h-[600px] flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Chat with Tambo</h2>
            </div>
            <MessageThread onNotesUpdate={handleNotesUpdate} />
          </div>
          
          <div className="h-[600px] overflow-y-auto">
            <NotesList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TamboProvider 
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
    >
      <HomePage />
    </TamboProvider>
  );
}
