import "@/app/(docs)/styles.css";
import { baseOptions } from "@/app/layout.config";
import HeaderBar from "@/components/header-bar";
import { ShutdownBanner } from "@/components/shutdown-banner";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ShutdownBanner />
      <HeaderBar />
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{ collapsible: false }}
        searchToggle={{
          enabled: false,
        }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
