import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tambo + Prisma Database Starter',
  description: 'AI-powered database operations with Tambo and Prisma',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
