"use client";

import FlickeringGrid from "@/components/ui/flickering-grid";
import { cn } from "@/lib/utils";
import React, { forwardRef, useRef } from "react";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

const Section = forwardRef<HTMLElement, SectionProps>(
  (
    { id, title, subtitle, description, children, className, align },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLElement>(null);
    const ref = forwardedRef || internalRef;
    const sectionId = title ? title.toLowerCase().replace(/\s+/g, "-") : id;
    const alignmentClass =
      align === "left"
        ? "text-left"
        : align === "right"
        ? "text-right"
        : "text-center";

    return (
      <section id={id} ref={ref}>
        <div className={cn("relative mx-auto container", className)}>
          {(title || subtitle || description) && (
            <div
              className={cn(
                alignmentClass,
                "relative mx-auto border-x border-t overflow-hidden p-2 py-8 md:p-12"
              )}
            >
              {title && (
                <h2 className="text-sm text-muted-foreground text-balance font-semibold tracking-tigh uppercase">
                  {title}
                </h2>
              )}

              {subtitle && (
                <h3
                  className={cn(
                    "mx-0 mt-4 max-w-lg text-5xl text-balance font-bold sm:max-w-none sm:text-4xl md:text-5xl lg:text-6xl leading-[1.2] tracking-tighter text-foreground lowercase",
                    align === "center"
                      ? "mx-auto"
                      : align === "right"
                      ? "ml-auto"
                      : ""
                  )}
                >
                  {subtitle}
                </h3>
              )}
              {description && (
                <p
                  className={cn(
                    "mt-6 text-lg leading-8 text-muted-foreground text-balance max-w-2xl",
                    align === "center"
                      ? "mx-auto"
                      : align === "right"
                      ? "ml-auto"
                      : ""
                  )}
                >
                  {description}
                </p>
              )}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-t from-background dark:from-background -z-10 from-50%" />
              <FlickeringGrid
                squareSize={4}
                gridGap={4}
                color="#6B7280"
                maxOpacity={0.2}
                flickerChance={0.1}
                className="-z-20 absolute inset-0 size-full"
              />
            </div>
          )}
          {children}
        </div>
      </section>
    );
  }
);

Section.displayName = "Section";

export { Section };
