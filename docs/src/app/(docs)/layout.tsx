import '@/app/(docs)/styles.css';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions} sidebar={{ collapsible: false }}>
      {children}
    </DocsLayout>
  );
}
