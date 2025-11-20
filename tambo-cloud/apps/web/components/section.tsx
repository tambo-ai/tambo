"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  title?: string;
  description?: string;
}

export function Section({
  id,
  title,
  description,
  children,
  className,
  ...props
}: SectionProps) {
  return (
    <section id={id} className={cn("pb-16 sm:pb-24", className)} {...props}>
      {title && (
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          {description && (
            <p className="text-xl text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
