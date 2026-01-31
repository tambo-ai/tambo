"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    primary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export { Badge };
