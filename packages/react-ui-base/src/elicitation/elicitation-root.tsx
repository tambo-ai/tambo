"use client";

import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { ElicitationProvider } from "./elicitation-context";

export interface ElicitationRootProps extends React.HTMLAttributes<HTMLDivElement> {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  children?: React.ReactNode;
}

export const ElicitationRoot = React.forwardRef<
  HTMLDivElement,
  ElicitationRootProps
>(({ request, onResponse, children, ...props }, ref) => {
  const requestFields = Object.entries(request.requestedSchema.properties);
  const isSingleEntry =
    requestFields.length === 1 &&
    (requestFields[0][1].type === "boolean" ||
      (requestFields[0][1].type === "string" && "enum" in requestFields[0][1]));

  return (
    <ElicitationProvider request={request} onResponse={onResponse}>
      <div
        ref={ref}
        data-slot="elicitation-root"
        data-mode={isSingleEntry ? "single" : "multiple"}
        {...props}
      >
        {children}
      </div>
    </ElicitationProvider>
  );
});
ElicitationRoot.displayName = "Elicitation.Root";
