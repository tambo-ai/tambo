"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoteCardProps {
  title: string;
  content: string;
}

export function NoteCard({ title, content }: NoteCardProps) {
  return (
    <Card className="w-full max-w-md border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-amber-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-amber-800 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}
