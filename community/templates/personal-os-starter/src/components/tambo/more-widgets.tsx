"use client";

import { cn } from "@/lib/utils";
import { Clock, ExternalLink, GitPullRequest, Newspaper } from "lucide-react";
import * as React from "react";
import { z } from "zod";

// --- GitHub Widget ---
export const githubWidgetSchema = z.object({
  repo: z.string(),
  prs: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      status: z.enum(["open", "merged", "closed"]),
    }),
  ),
  commits: z.number().optional(),
});
export type GithubWidgetProps = z.infer<typeof githubWidgetSchema>;

export const GithubWidget = ({ repo, prs, commits }: GithubWidgetProps) => (
  <div className="flex flex-col h-full w-full p-4 bg-[#0d1117] text-[#c9d1d9] rounded-xl border border-[#30363d]">
    <div className="flex justify-between items-center mb-4">
      <span className="font-semibold text-sm flex items-center gap-2">
        <svg
          height="20"
          viewBox="0 0 16 16"
          version="1.1"
          width="20"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0 4.42 3.58 8 8 8Z"></path>
        </svg>
        {repo}
      </span>
      {commits && (
        <span className="text-xs text-[#8b949e]">
          {commits} commits this week
        </span>
      )}
    </div>
    <div className="flex flex-col space-y-2">
      {prs.map((pr) => (
        <div key={pr.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <GitPullRequest
              className={cn(
                "w-4 h-4",
                pr.status === "open" ? "text-green-500" : "text-purple-500",
              )}
            />
            <span className="truncate">{pr.title}</span>
          </div>
          <span className="text-[#8b949e] ml-2">#{pr.id}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Timer Widget ---
export const timerWidgetSchema = z.object({
  label: z.string(),
  durationMinutes: z.number(),
});
export type TimerWidgetProps = z.infer<typeof timerWidgetSchema>;

export const TimerWidget = ({ label, durationMinutes }: TimerWidgetProps) => {
  const [timeLeft, setTimeLeft] = React.useState(durationMinutes * 60);
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      onClick={() => setIsActive(!isActive)}
      className="flex flex-col items-center justify-center h-full w-full p-4 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors"
    >
      <Clock
        className={cn("w-8 h-8 mb-2 opacity-80", isActive && "animate-pulse")}
      />
      <span className="text-4xl font-mono font-bold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <span className="text-sm opacity-80 mt-1">
        {label} {isActive ? "(Running)" : "(Paused)"}
      </span>
    </div>
  );
};

// --- News Widget ---
export const newsWidgetSchema = z.object({
  category: z.string(),
  headline: z.string(),
  source: z.string(),
});
export type NewsWidgetProps = z.infer<typeof newsWidgetSchema>;

export const NewsWidget = ({ category, headline, source }: NewsWidgetProps) => (
  <div className="flex flex-col justify-between h-full w-full p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
    <div className="flex justify-between items-start">
      <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
        {category}
      </span>
      <Newspaper className="w-4 h-4 text-neutral-400" />
    </div>
    <p className="font-serif font-medium text-lg text-neutral-900 dark:text-neutral-100 leading-tight">
      {headline}
    </p>
    <div className="flex items-center gap-1 text-xs text-neutral-500">
      <span>{source}</span>
      <ExternalLink className="w-3 h-3" />
    </div>
  </div>
);
