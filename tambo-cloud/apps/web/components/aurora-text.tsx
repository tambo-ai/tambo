"use client";

import React from "react";

import { cn } from "@/lib/utils";

export function AuroraText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative overflow-hidden inline-flex bg-background",
        className,
      )}
    >
      {children}
      <div className="aurora absolute inset-0 pointer-events-none mix-blend-lighten dark:mix-blend-darken">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="aurora__item absolute w-[60vw] h-[60vw]"
            style={{
              backgroundColor: `hsl(var(--color-${i + 1}))`,
              filter: "blur(1rem)",
              animation: `aurora-${i + 1} 12s ease-in-out infinite alternate`,
              mixBlendMode: "overlay",
              ...getInitialPosition(i),
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes aurora-1 {
          0%,
          100% {
            top: 0;
            right: 0;
          }
          50% {
            top: 50%;
            right: 25%;
          }
          75% {
            top: 25%;
            right: 50%;
          }
        }
        @keyframes aurora-2 {
          0%,
          100% {
            top: 0;
            left: 0;
          }
          60% {
            top: 75%;
            left: 25%;
          }
          85% {
            top: 50%;
            left: 50%;
          }
        }
        @keyframes aurora-3 {
          0%,
          100% {
            bottom: 0;
            left: 0;
          }
          40% {
            bottom: 50%;
            left: 25%;
          }
          65% {
            bottom: 25%;
            left: 50%;
          }
        }
        @keyframes aurora-4 {
          0%,
          100% {
            bottom: 0;
            right: 0;
          }
          50% {
            bottom: 25%;
            right: 40%;
          }
          90% {
            bottom: 50%;
            right: 25%;
          }
        }
      `}</style>
    </span>
  );
}

function getInitialPosition(index: number): React.CSSProperties {
  const positions = [
    { top: "-50%" },
    { right: 0, top: 0 },
    { left: 0, bottom: 0 },
    { right: 0, bottom: "-50%" },
  ];
  return positions[index] || {};
}
