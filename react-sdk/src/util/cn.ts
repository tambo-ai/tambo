import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to combine CSS classes with proper Tailwind CSS merging
 * @param inputs - CSS classes to combine
 * @returns Combined CSS classes string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

