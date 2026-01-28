"use client";

import { cn } from "@/lib/utils";
import { Check, Cloud, Play, SkipForward } from "lucide-react";
import * as React from "react";
import { z } from "zod";

// --- Weather Widget ---
export const weatherWidgetSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.enum(["Sunny", "Cloudy", "Rainy", "Snowy"]),
});
export type WeatherWidgetProps = z.infer<typeof weatherWidgetSchema>;

export const WeatherWidget = ({
  city,
  temperature,
  condition,
}: WeatherWidgetProps) => (
  <div className="flex flex-col justify-between h-full w-full p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl text-white">
    <div className="flex justify-between items-start">
      <span className="font-semibold">{city}</span>
      <Cloud className="w-6 h-6" />
    </div>
    <div className="flex flex-col">
      <span className="text-4xl font-bold">{temperature}°</span>
      <span className="text-sm opacity-80">{condition}</span>
    </div>
  </div>
);

// --- Tasks Widget ---
export const tasksWidgetSchema = z.object({
  title: z.string(),
  tasks: z.array(
    z.object({ id: z.string(), label: z.string(), completed: z.boolean() }),
  ),
});
export type TasksWidgetProps = z.infer<typeof tasksWidgetSchema>;

export const TasksWidget = ({
  title,
  tasks: initialTasks,
}: TasksWidgetProps) => {
  const [tasks, setTasks] = React.useState(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <h3 className="font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
        {title}
      </h3>
      <div className="flex flex-col space-y-2">
        {tasks.slice(0, 3).map((task, i) => (
          <div
            key={i}
            onClick={() => toggleTask(task.id)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                task.completed
                  ? "bg-green-500 border-green-500"
                  : "border-neutral-400 group-hover:border-green-400",
              )}
            >
              {task.completed && <Check className="w-3 h-3 text-white" />}
            </div>
            <span
              className={cn(
                "text-sm transition-all",
                task.completed && "line-through text-neutral-400",
              )}
            >
              {task.label}
            </span>
          </div>
        ))}
        {tasks.length > 3 && (
          <span className="text-xs text-neutral-400">
            +{tasks.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
};

// --- Music Widget ---
export const musicWidgetSchema = z.object({
  song: z.string(),
  artist: z.string(),
  coverUrl: z.string().optional(),
});
export type MusicWidgetProps = z.infer<typeof musicWidgetSchema>;

export const MusicWidget = ({ song, artist }: MusicWidgetProps) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="flex flex-col justify-between h-full p-4 bg-zinc-900 text-white rounded-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
      <div className="flex justify-end z-20">
        <div className="flex gap-1 items-end h-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-green-500 rounded-full transition-all duration-300",
                isPlaying ? "h-full animate-pulse" : "h-1",
              )}
            />
          ))}
        </div>
      </div>
      <div className="z-20">
        <h4 className="font-semibold truncate">{song}</h4>
        <p className="text-xs text-zinc-400 truncate">{artist}</p>
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="hover:scale-110 transition"
          >
            {isPlaying ? (
              <Play className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white opacity-50" />
            )}
          </button>
          <div className="h-1 bg-zinc-700 w-full rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-white transition-all duration-[2000ms] ease-linear",
                isPlaying ? "w-full" : "w-1/3",
              )}
            />
          </div>
          <SkipForward className="w-4 h-4 hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

// --- Stats Widget ---
export const statsWidgetSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: z.string().optional(),
  trendUp: z.boolean().optional(),
});
export type StatsWidgetProps = z.infer<typeof statsWidgetSchema>;

export const StatsWidget = ({
  label,
  value,
  trend,
  trendUp,
}: StatsWidgetProps) => (
  <div className="p-4 flex flex-col justify-center items-center h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
    <span className="text-sm text-neutral-500 mb-1">{label}</span>
    <span className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
      {value}
    </span>
    {trend && (
      <span
        className={cn(
          "text-xs font-medium mt-1",
          trendUp ? "text-green-500" : "text-red-500",
        )}
      >
        {trend}
      </span>
    )}
  </div>
);
