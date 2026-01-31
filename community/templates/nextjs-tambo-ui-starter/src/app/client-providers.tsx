'use client';

import { TamboProvider } from '@tambo-ai/react';
import { ReactNode } from 'react';
import { components } from '@/components/tambo';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? '';

  if (!apiKey) {
    console.error('NEXT_PUBLIC_TAMBO_API_KEY is not set!');
  } else {
    console.log('API Key loaded');
  }

  console.log('Registering components:', components.length);

  return (
    <TamboProvider apiKey={apiKey} components={components}>
      {children}
    </TamboProvider>
  );
}
