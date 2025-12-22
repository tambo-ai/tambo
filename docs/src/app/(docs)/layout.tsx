import "@/app/(docs)/styles.css";
import { baseOptions } from "@/app/layout.config";
import { DocsLayoutClient } from "@/components/docs-layout-client";
import HeaderBar from "@/components/header-bar";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <HeaderBar />
      <DocsLayoutClient
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{ collapsible: false }}
        searchToggle={{
          enabled: false,
        }}
      >
        {children}
      </DocsLayoutClient>
    </div>
  );
}
