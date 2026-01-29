'use client';

import type { Metadata } from 'next';
import { TamboProvider } from '@tambo-ai/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
