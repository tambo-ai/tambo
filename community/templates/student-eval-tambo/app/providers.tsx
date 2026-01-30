"use client";

import { TamboProvider } from "@tambo-ai/react";
import {
  getAllStudentsTool,
  getLowPerformersTool,
  getSubjectSummaryTool,
} from "@/tools/studentTools";

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <h2 className="text-red-800 font-bold mb-2">Configuration Error</h2>
        <p className="text-red-700">
          NEXT_PUBLIC_TAMBO_API_KEY is not set. Please add it to your .env.local
          file.
        </p>
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      tools={[getAllStudentsTool, getLowPerformersTool, getSubjectSummaryTool]}
    >
      {children}
    </TamboProvider>
  );
}
