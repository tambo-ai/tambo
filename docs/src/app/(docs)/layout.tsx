import "@/app/(docs)/styles.css";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{ collapsible: false }}
      containerProps={{ className: "[--fd-nav-height:56px]" }}
    >
      {children as React.ReactNode}
    </DocsLayout>
  );
}
