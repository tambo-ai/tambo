"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../../types/component-render-or-children";
import { useRender } from "../../../use-render/use-render";
import { useMcpResourceButtonContext } from "../root/mcp-resource-button-context";

export interface McpResourceButtonSearchInputRenderProps {
  /** Current search query value */
  value: string;
  /** Handler to update the search query */
  onChange: (value: string) => void;
  /** Handler to close the dropdown */
  onClose: () => void;
}

export type McpResourceButtonSearchInputProps =
  BasePropsWithChildrenOrRenderFunction<
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">,
    McpResourceButtonSearchInputRenderProps
  >;

/**
 * Search input primitive for filtering resources.
 * Provides search functionality within the resource dropdown.
 * @returns The search input element
 */
export const McpResourceButtonSearchInput = React.forwardRef<
  HTMLInputElement,
  McpResourceButtonSearchInputProps
>((props, ref) => {
  const { searchQuery, setSearchQuery, setIsOpen } =
    useMcpResourceButtonContext();

  const renderProps: McpResourceButtonSearchInputRenderProps = {
    value: searchQuery,
    onChange: setSearchQuery,
    onClose: () => setIsOpen(false),
  };

  const { content, componentProps } = useRender(props, renderProps);
  const { asChild, ...rest } = componentProps;

  // If using render prop pattern, just render the content
  if ("render" in props && typeof props.render === "function") {
    return <>{content}</>;
  }

  const Comp = asChild ? Slot : "input";

  return (
    <Comp
      ref={ref}
      type="text"
      data-slot="mcp-resource-button-search-input"
      value={searchQuery}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setSearchQuery(e.target.value)
      }
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      }}
      {...rest}
    >
      {content}
    </Comp>
  );
});
McpResourceButtonSearchInput.displayName = "McpResourceButton.SearchInput";
