"use client";
import React from "react";
import type { CSSProperties, KeyboardEvent } from "react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  style: CSSProperties;
}

/**
 * Search input for filtering the sidebar list by name or description.
 * Pressing Enter or ArrowDown delegates focus to the list.
 * @param props - Current value, change handler, navigation callback, and style
 * @returns Controlled text input
 */
export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  onSubmit,
  style,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <input
      type="text"
      placeholder="Search…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      style={style}
      aria-label="Search registry"
    />
  );
};
