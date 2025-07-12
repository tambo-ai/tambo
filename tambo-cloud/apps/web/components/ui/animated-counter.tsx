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
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (target > 0 && !isAnimating && !hasAnimated) {
      setIsAnimating(true);
      setHasAnimated(true);

      setTimeout(() => {
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
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      }, delay);
    }
  }, [target, duration, delay, isAnimating, hasAnimated]);

  const displayValue = formatNumber
    ? animatedValue.toLocaleString()
    : animatedValue.toString();

  if (children) {
    return <>{children(animatedValue)}</>;
  }

  return <span>{displayValue}</span>;
}
