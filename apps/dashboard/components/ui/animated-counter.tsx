"use client";

import React from "react";

interface AnimatedCounterProps {
  /** The target number to count up to */
  target: number;
  /** Animation duration in milliseconds (default: 2500) */
  duration?: number;
  /** Delay before starting animation in milliseconds (default: 800) */
  delay?: number;
  /** Whether to format the number with commas (default: true) */
  formatNumber?: boolean;
  /** Custom render function for the animated value */
  children?: (value: number) => React.ReactNode;
}

export function AnimatedCounter({
  target,
  duration = 2500,
  delay = 250,
  formatNumber = true,
  children,
}: AnimatedCounterProps) {
  const [animatedValue, setAnimatedValue] = React.useState(0);

  // Use refs to track animation state to avoid dependency issues
  const isAnimatingRef = React.useRef(false);
  const hasAnimatedRef = React.useRef(false);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const timeoutIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (target > 0 && !isAnimatingRef.current && !hasAnimatedRef.current) {
      isAnimatingRef.current = true;
      hasAnimatedRef.current = true;

      timeoutIdRef.current = window.setTimeout(() => {
        const startTime = Date.now();
        const startValue = 0;
        const endValue = target;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation (easeOutQuart)
          const easeProgress = 1 - Math.pow(1 - progress, 4);

          const currentValue = Math.floor(
            startValue + (endValue - startValue) * easeProgress,
          );
          setAnimatedValue(currentValue);

          if (progress < 1) {
            animationFrameIdRef.current = requestAnimationFrame(animate);
          } else {
            isAnimatingRef.current = false;
            animationFrameIdRef.current = null;
          }
        };

        animationFrameIdRef.current = requestAnimationFrame(animate);
      }, delay);
    }
  }, [target, duration, delay]);

  // Separate cleanup effect that only runs on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  const displayValue = formatNumber
    ? animatedValue.toLocaleString()
    : animatedValue.toString();

  if (children) {
    return <>{children(animatedValue)}</>;
  }

  return <span>{displayValue}</span>;
}
