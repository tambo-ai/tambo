import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import "./styles.css"; // Import custom docs styles

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      nav={{
        ...baseOptions.nav,
      }}
      links={[
        {
          text: "Documentation",
          url: "/docs",
        },
      ]}
      containerProps={{
        className: "bg-fd-background",
      }}
    >
      {children}
    </DocsLayout>
  );
}
