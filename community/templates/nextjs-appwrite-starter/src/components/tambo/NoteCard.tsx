"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface NoteCardProps {
  title: string;
  content: string;
}

export function NoteCard({ title, content }: NoteCardProps) {
  return (
    <Card className="w-full max-w-md border-primary/20 bg-gradient-to-br from-card to-accent/30 hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </CardContent>
    </Card>
  );
}
