'use client';

import { TamboProvider } from '@tambo-ai/react';
import { ChatInterface } from '@/components/ChatInterface';
import { tamboComponents, tamboTools } from '@/lib/tambo-config';

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-sw-space flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-sw-yellow mb-4">API Key Required</h1>
          <p className="text-gray-400 mb-6">
            Please set your <code className="text-sw-blue">NEXT_PUBLIC_TAMBO_API_KEY</code> in a{' '}
            <code className="text-sw-blue">.env.local</code> file.
          </p>
          <p className="text-sm text-gray-500">
            Get your API key from{' '}
            <a
              href="https://cloud.tambo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sw-yellow hover:underline"
            >
              cloud.tambo.co
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider apiKey={apiKey} components={tamboComponents} tools={tamboTools}>
      <div className="starfield fixed inset-0 -z-10" />
      <ChatInterface />
    </TamboProvider>
  );
}
