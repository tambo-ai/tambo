"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ComponentProps } from "react";

export type DocsLayoutClientProps = ComponentProps<typeof DocsLayout>;

export function DocsLayoutClient(props: DocsLayoutClientProps) {
  return <DocsLayout {...props} />;
}
