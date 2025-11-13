"use client";

import { CLI } from "@/components/cli";

interface InstallationSectionProps {
  cliCommand: string;
}

export function InstallationSection({ cliCommand }: InstallationSectionProps) {
  // TODO: Add manual installation steps with specific file paths, imports, and dependencies
  // For now, we only show the CLI command since the manual fallback was too generic

  return (
    <>
      <h2 className="mt-12">Installation</h2>

      <div className="not-prose">
        <CLI command={cliCommand} />
      </div>
    </>
  );
}
