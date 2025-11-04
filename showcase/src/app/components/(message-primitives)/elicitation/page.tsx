"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { ElicitationUI } from "@/components/ui/elicitation-ui";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import type { ReactNode } from "react";
import { useState } from "react";

const permissionRequest: TamboElicitationRequest = {
  message: "I'm about to delete 47 old log files. Should I proceed?",
  requestedSchema: {
    type: "object",
    properties: {
      confirm: {
        type: "boolean",
        description: "Confirm deletion",
      },
    },
    required: ["confirm"],
  },
};

const usageCode = `import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import { useTamboElicitationContext } from "@tambo-ai/react/mcp";

export function ElicitationPrompt() {
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  if (!elicitation) {
    return null;
  }

  return (
    <ElicitationUI
      request={elicitation}
      onResponse={(response) => resolveElicitation?.(response)}
    />
  );
}`;

interface InfoCard {
  key: string;
  label: string;
  description: ReactNode;
}

const schemaItems: InfoCard[] = [
  {
    key: "boolean",
    label: "Boolean",
    description: (
      <>
        Renders yes/no buttons. Single-field boolean requests auto-submit on
        selection.
      </>
    ),
  },
  {
    key: "string-enum",
    label: "String enum",
    description: (
      <>
        Renders choice buttons. Provide <code>enumNames</code> to override the
        labels shown in the UI.
      </>
    ),
  },
  {
    key: "string",
    label: "String",
    description: (
      <>
        Renders a text input. Supports <code>minLength</code>,{" "}
        <code>maxLength</code>, <code>pattern</code>, and formats like{" "}
        <code>email</code>, <code>uri</code>, <code>date</code>, and{" "}
        <code>date-time</code>.
      </>
    ),
  },
  {
    key: "number",
    label: "Number or integer",
    description: (
      <>
        Renders a number input with <code>minimum</code>, <code>maximum</code>,
        and <code>default</code> value support.
      </>
    ),
  },
];

const behaviorItems: InfoCard[] = [
  {
    key: "single-entry",
    label: "Single-entry mode",
    description: (
      <>
        One boolean or enum field suppresses the submit bar and resolves
        immediately after the user selects a choice.
      </>
    ),
  },
  {
    key: "multi-entry",
    label: "Multi-field mode",
    description: (
      <>
        Multiple fields or freeform text inputs render submit, decline, and
        cancel actions. Submit stays disabled until every required field
        validates.
      </>
    ),
  },
  {
    key: "validation",
    label: "Validation feedback",
    description: (
      <>
        Errors display inline once the user interacts with a field. The
        component enforces every schema constraint before calling{" "}
        <code>onResponse</code>.
      </>
    ),
  },
];

export default function ElicitationPage() {
  return (
    <div className="prose max-w-full space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          MCP Elicitation UI
        </h1>
        <p className="text-lg text-muted-foreground">
          A focused prompt surface for Model Context Protocol interactions. The
          UI pauses the workflow, renders JSON Schema-driven fields, and
          dispatches the user&apos;s answer back to the MCP server.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Usage</h2>
        <p className="text-muted-foreground">
          The Message Input component wires this UI automatically, but you can
          render it directly if you need a bespoke elicitation surface.
        </p>
        <ComponentCodePreview
          title="Render inside a custom component"
          component={<UsagePreview />}
          code={usageCode}
          previewClassName="p-6"
        />
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add elicitation-ui" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">ElicitationUI</h3>

            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>request</td>
                  <td>TamboElicitationRequest</td>
                  <td>-</td>
                  <td>
                    The active elicitation payload from the MCP server. Includes
                    the display message plus a JSON Schema describing required
                    inputs.
                  </td>
                </tr>
                <tr>
                  <td>onResponse</td>
                  <td>(response: TamboElicitationResponse) =&gt; void</td>
                  <td>-</td>
                  <td>
                    Callback fired when the user accepts, declines, or cancels
                    the elicitation. Receives the action plus any form data.
                  </td>
                </tr>
                <tr>
                  <td>className</td>
                  <td>string</td>
                  <td>-</td>
                  <td>
                    Optional wrapper classes for tailoring spacing or layout in
                    your app shell.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Schema Reference</h2>
        <p className="text-sm text-muted-foreground">
          Elicitation requests describe each field with JSON Schema. The UI
          currently supports the following primitives:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {schemaItems.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-border bg-muted/40 p-4"
            >
              <div className="text-sm font-semibold text-foreground">
                {item.label}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Each field can include a <code>description</code> for its label and a{" "}
          <code>default</code> for pre-filled values. Mark required fields on
          the root schema&apos;s <code>required</code> array.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Behavior</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {behaviorItems.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-border bg-muted/40 p-4"
            >
              <div className="text-sm font-semibold text-foreground">
                {item.label}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsagePreview() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This demo mimics a destructive-action confirmation. Pick an option to
        see the response payload Tambo sends back to your handler.
      </p>
      <ExamplePreview request={permissionRequest} />
    </div>
  );
}

function ExamplePreview({ request }: { request: TamboElicitationRequest }) {
  const [response, setResponse] = useState<TamboElicitationResponse | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <RequestDisclosure request={request} />
      <ElicitationUI
        request={request}
        onResponse={(result) => setResponse(result)}
      />
      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        {response ? (
          <>
            <div className="mb-2 font-semibold text-foreground">Response</div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-foreground/80">
              {JSON.stringify(response, null, 2)}
            </pre>
          </>
        ) : (
          <span>Interact with the UI to preview the response JSON.</span>
        )}
      </div>
    </div>
  );
}

function RequestDisclosure({ request }: { request: TamboElicitationRequest }) {
  return (
    <details className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">
        View request JSON
      </summary>
      <pre className="mt-3 overflow-x-auto rounded-md bg-background/90 p-3 text-xs text-foreground/80">
        {JSON.stringify(request, null, 2)}
      </pre>
    </details>
  );
}
