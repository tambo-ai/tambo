"use client";

import { cn } from "@/lib/utils";
import { ExternalLinkIcon, Eye, Github } from "lucide-react";
import * as React from "react";

export type GitHubIssueCreatorProps = React.HTMLAttributes<HTMLDivElement>;

type Repository = {
  name: string;
  url: string;
  description: string;
};

const repositories: Repository[] = [
  {
    name: "Main Monorepo",
    url: "https://github.com/tambo-ai/tambo",
    description: "Core tambo functionality, React SDK, CLI, and documentation",
  },
  {
    name: "Cloud Services",
    url: "https://github.com/tambo-ai/tambo",
    description:
      "Hosted backend services and cloud infrastructure (tambo-cloud directory)",
  },
];

export const GitHubIssueCreator = React.forwardRef<
  HTMLDivElement,
  GitHubIssueCreatorProps
>(({ className, ...props }, ref) => {
  const [issueTitle, setIssueTitle] = React.useState("");
  const [selectedRepo, setSelectedRepo] = React.useState<Repository>(
    repositories[0],
  );

  const handleCreateIssue = () => {
    if (!issueTitle.trim()) {
      return;
    }

    const encodedTitle = encodeURIComponent(issueTitle.trim());
    const issueUrl = `${selectedRepo.url}/issues/new?title=${encodedTitle}`;

    window.open(issueUrl, "_blank", "noopener,noreferrer");
  };

  const handleBrowseRepo = (repoUrl: string) => {
    window.open(repoUrl, "_blank", "noopener,noreferrer");
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCreateIssue();
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-background p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Github className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Create GitHub Issue
              </h3>
              <p className="text-sm text-muted-foreground">
                Report bugs, request features, or suggest improvements
              </p>
            </div>
          </div>
        </div>

        {/* Repository Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Choose Repository
          </h4>
          <div className="grid gap-3">
            {repositories.map((repo) => (
              <div
                key={repo.name}
                className={cn(
                  "group rounded-lg border p-4 transition-all duration-200",
                  selectedRepo.name === repo.name
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <button
                      onClick={() => setSelectedRepo(repo)}
                      className="flex flex-col items-start gap-2 text-left w-full cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 transition-colors",
                            selectedRepo.name === repo.name
                              ? "border-primary bg-primary"
                              : "border-muted-foreground group-hover:border-primary",
                          )}
                        >
                          {selectedRepo.name === repo.name && (
                            <div className="h-full w-full rounded-full bg-primary-foreground scale-50" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{repo.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {repo.description}
                      </p>
                    </button>
                  </div>
                  <button
                    onClick={() => handleBrowseRepo(repo.url)}
                    className="flex items-center gap-2 rounded-md border border-border bg-background cursor-pointer px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-primary/20"
                    title="Browse repository on GitHub"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Title Input */}
        <div className="space-y-3">
          <label
            htmlFor="issue-title"
            className="text-sm font-medium text-foreground"
          >
            Issue Title
          </label>
          <input
            id="issue-title"
            type="text"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a descriptive title for your issue..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleCreateIssue}
            disabled={!issueTitle.trim()}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all",
              issueTitle.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <Github className="h-4 w-4" />
            <span>Create Issue on {selectedRepo.name}</span>
            <ExternalLinkIcon className="h-4 w-4" />
          </button>

          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll be redirected to GitHub where you can add additional
            details
          </p>
        </div>
      </div>
    </div>
  );
});

GitHubIssueCreator.displayName = "GitHubIssueCreator";
