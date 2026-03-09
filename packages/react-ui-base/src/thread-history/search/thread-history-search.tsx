"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useThreadHistoryContext } from "../root/thread-history-context";

export interface ThreadHistorySearchState extends Record<string, unknown> {
  slot: string;
  searchQuery: string;
}

export type ThreadHistorySearchProps = useRender.ComponentProps<
  "input",
  ThreadHistorySearchState
>;

/**
 * Search input for filtering threads by query.
 * Reads and writes the search query from ThreadHistory context.
 */
export const ThreadHistorySearch = React.forwardRef<
  HTMLInputElement,
  ThreadHistorySearchProps
>((props, ref) => {
  const { searchQuery, setSearchQuery } = useThreadHistoryContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const { render, ...componentProps } = props;
  const state: ThreadHistorySearchState = {
    slot: "thread-history-search",
    searchQuery,
  };

  return useRender({
    defaultTagName: "input",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "text",
      value: searchQuery,
      onChange: handleChange,
      "aria-label": "Search threads",
    }),
  });
});
ThreadHistorySearch.displayName = "ThreadHistory.Search";
