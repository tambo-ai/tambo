import { baseOptions } from "@/app/layout.config";
import { vnextSource } from "@/lib/vnext-source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={vnextSource.pageTree}
      {...baseOptions}
      nav={{
        ...baseOptions.nav,
        transparentMode: "always",
      }}
      links={[
        {
          text: "Documentation",
          url: "/vnext",
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
