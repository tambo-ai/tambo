"use client";

import { TamboProvider } from "@tambo-ai/react";

export default function Page() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return <div className="p-4">Set NEXT_PUBLIC_TAMBO_API_KEY to enable Tambo.</div>;
  }

  return (
    <TamboProvider apiKey={apiKey}>
      <div className="p-4">Tambo is connected.</div>
    </TamboProvider>
  );
}
