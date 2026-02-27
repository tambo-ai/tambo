"use client";

import { Elicitation } from "@tambo-ai/react-ui-base/elicitation";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";

const mockRequest: TamboElicitationRequest = {
  message: "Please configure your project settings:",
  requestedSchema: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        title: "Project Name",
        description: "A unique name for your project",
      },
      framework: {
        type: "string",
        title: "Framework",
        description: "Select your preferred framework",
        enum: ["Next.js", "Remix", "Vite", "Astro"],
      },
      maxTokens: {
        type: "number",
        title: "Max Tokens",
        description: "Maximum token limit per request",
      },
      enableStreaming: {
        type: "boolean",
        title: "Enable Streaming",
        description: "Stream responses in real-time",
      },
    },
    required: ["projectName", "framework"],
  },
};

export function ElicitationDemo() {
  const handleResponse = (response: TamboElicitationResponse) => {
    console.log("Elicitation response:", response);
  };

  return (
    <Elicitation.Root request={mockRequest} onResponse={handleResponse}>
      <Elicitation.Message className="mb-3 text-sm text-neutral-700 dark:text-neutral-300" />
      <Elicitation.Fields
        render={(_props, { fields }) => (
          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <Elicitation.Field key={field.name} field={field}>
                <Elicitation.FieldLabel className="text-sm font-medium text-neutral-900 dark:text-neutral-100" />
                <Elicitation.FieldInput className="mt-1">
                  <Elicitation.FieldBooleanInput />
                  <Elicitation.FieldEnumInput />
                  <Elicitation.FieldStringInput className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:text-neutral-100 dark:focus:ring-neutral-600" />
                  <Elicitation.FieldNumberInput className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:text-neutral-100 dark:focus:ring-neutral-600" />
                </Elicitation.FieldInput>
                <Elicitation.FieldError className="mt-1 text-xs text-red-600 dark:text-red-400" />
              </Elicitation.Field>
            ))}
          </div>
        )}
      />
      <Elicitation.Actions className="mt-4 flex items-center gap-2">
        <Elicitation.ActionDecline className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
          Decline
        </Elicitation.ActionDecline>
        <Elicitation.ActionCancel className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
          Cancel
        </Elicitation.ActionCancel>
        <Elicitation.ActionSubmit className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300" />
      </Elicitation.Actions>
    </Elicitation.Root>
  );
}
