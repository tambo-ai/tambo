"use client";

import { InstallationSection } from "@/components/installation-section";
import { ElicitationUI } from "@tambo-ai/ui-registry/components/elicitation-ui";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import type { ReactNode } from "react";
import { useState } from "react";

// Request constants for all 8 examples
const booleanRequest: TamboElicitationRequest = {
  message: "Do you want to delete all temporary files?",
  requestedSchema: {
    type: "object",
    properties: {
      confirm_delete: {
        type: "boolean",
        description: "Confirm deletion",
      },
    },
    required: ["confirm_delete"],
  },
};

const enumRequest: TamboElicitationRequest = {
  message: "What would you like to do?",
  requestedSchema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description: "Select a task",
        enum: ["install", "uninstall", "update"],
        enumNames: ["Install Python", "Uninstall Python", "Update Python"],
      },
    },
    required: ["task"],
  },
};

const textRequest: TamboElicitationRequest = {
  message: "Please provide the API endpoint URL",
  requestedSchema: {
    type: "object",
    properties: {
      api_url: {
        type: "string",
        description: "Enter the API endpoint URL",
        format: "uri",
      },
    },
    required: ["api_url"],
  },
};

const numberRequest: TamboElicitationRequest = {
  message: "How many workers should be started?",
  requestedSchema: {
    type: "object",
    properties: {
      worker_count: {
        type: "integer",
        description: "Number of workers (1-16)",
        minimum: 1,
        maximum: 16,
      },
    },
    required: ["worker_count"],
  },
};

const multipleFieldsRequest: TamboElicitationRequest = {
  message: "Please provide database connection details",
  requestedSchema: {
    type: "object",
    properties: {
      host: {
        type: "string",
        description: "Database host",
      },
      port: {
        type: "integer",
        description: "Database port",
        minimum: 1,
        maximum: 65535,
      },
      database: {
        type: "string",
        description: "Database name",
      },
      ssl: {
        type: "boolean",
        description: "Use SSL connection?",
      },
    },
    required: ["host", "port", "database", "ssl"],
  },
};

const emailRequest: TamboElicitationRequest = {
  message: "Please provide your email address",
  requestedSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Enter your email address",
        format: "email",
      },
    },
    required: ["email"],
  },
};

const optionalRequest: TamboElicitationRequest = {
  message: "Configure report settings",
  requestedSchema: {
    type: "object",
    properties: {
      report_name: {
        type: "string",
        description: "Report name",
      },
      include_charts: {
        type: "boolean",
        description: "Include charts in report? (optional)",
      },
      recipients: {
        type: "string",
        description: "Email recipients (optional)",
      },
    },
    required: ["report_name"],
  },
};

const deploymentRequest: TamboElicitationRequest = {
  message: "Configure deployment settings",
  requestedSchema: {
    type: "object",
    properties: {
      environment: {
        type: "string",
        description: "Deployment environment",
        enum: ["staging", "production"],
      },
      enable_monitoring: {
        type: "boolean",
        description: "Enable monitoring?",
      },
      replicas: {
        type: "integer",
        description: "Number of replicas",
        minimum: 1,
        maximum: 10,
      },
    },
    required: ["environment", "enable_monitoring", "replicas"],
  },
};

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
    <div className="prose max-w-8xl space-y-12">
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

      <section className="not-prose">
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
          <p className="font-semibold mb-2">Overview:</p>
          <p>
            The ElicitationUI component handles dynamic user input collection
            from MCP servers. For detailed information about elicitation in MCP,
            see the{" "}
            <a
              href="https://docs.tambo.co/concepts/model-context-protocol/features/elicitation"
              className="text-primary-link hover:underline"
            >
              elicitation documentation
            </a>
            .
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Installation</h2>
        <div className="not-prose space-y-4">
          <InstallationSection cliCommand="npx tambo add elicitation-ui" />
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
            <p className="font-semibold mb-2">Note:</p>
            <p>
              The Elicitation UI is automatically included when you use{" "}
              <code className="px-1 py-0.5 bg-background rounded">
                MessageInput
              </code>
              . You only need to install it separately if you want to use it
              standalone or customize its behavior.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Examples</h2>

        {/* Behavioral note callout */}
        <div className="not-prose">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
            <p className="font-semibold mb-2">Note on UI Behavior:</p>
            <p>
              When there is <strong>only one question</strong>, the UI renders
              without a Submit button and returns the response immediately upon
              interaction. When there are <strong>multiple questions</strong>, a
              Submit button appears and the response is returned when the user
              clicks Submit.
            </p>
          </div>
        </div>

        {/* Example 1: Boolean */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              1. Permission Request (Boolean)
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP server asks for permission before performing a potentially
              destructive action.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={booleanRequest} />
          </div>
        </div>

        {/* Example 2: Enum with enumNames */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              2. Disambiguation (Multiple Choice)
            </h3>
            <p className="text-sm text-muted-foreground">
              Using{" "}
              <code className="px-1 py-0.5 bg-background rounded">
                enumNames
              </code>{" "}
              to provide user-friendly labels for enum values.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={enumRequest} />
          </div>
        </div>

        {/* Example 3: Text with format validation */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              3. Missing Information (Text Input)
            </h3>
            <p className="text-sm text-muted-foreground">
              Text field with URI format validation ensuring valid URLs.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={textRequest} />
          </div>
        </div>

        {/* Example 4: Integer with constraints */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              4. Numeric Parameter
            </h3>
            <p className="text-sm text-muted-foreground">
              Integer input with minimum and maximum constraints.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={numberRequest} />
          </div>
        </div>

        {/* Example 5: Multiple fields */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              5. Multiple Fields
            </h3>
            <p className="text-sm text-muted-foreground">
              Database connection configuration with mixed field types and a
              Submit button.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={multipleFieldsRequest} />
          </div>
        </div>

        {/* Example 6: Email validation */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              6. Email Validation
            </h3>
            <p className="text-sm text-muted-foreground">
              Email format validation with real-time feedback.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={emailRequest} />
          </div>
        </div>

        {/* Example 7: Optional fields */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              7. Optional Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Mix of required and optional fields. Optional fields are marked
              with &quot;(optional)&quot;.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={optionalRequest} />
          </div>
        </div>

        {/* Example 8: Deployment config */}
        <div className="not-prose space-y-4">
          <div>
            <h3 className="text-lg font-500 text-foreground mb-2">
              8. Deployment Configuration
            </h3>
            <p className="text-sm text-muted-foreground">
              Complex configuration with enum, boolean, and integer fields for
              deployment settings.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <ExamplePreview request={deploymentRequest} />
          </div>
        </div>
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

        <div className="not-prose space-y-4 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Type Details
          </h3>

          <div className="border-l-4 border-accent pl-4 py-2 bg-muted/20 rounded-r">
            <strong className="text-foreground">Boolean</strong>
            <code className="ml-2 text-xs">{'{ type: "boolean" }'}</code>
            <p className="text-sm text-muted-foreground mt-1">
              Renders as a switch or checkbox. Ideal for yes/no questions and
              permission requests.
            </p>
          </div>

          <div className="border-l-4 border-accent pl-4 py-2 bg-muted/20 rounded-r">
            <strong className="text-foreground">String</strong>
            <code className="ml-2 text-xs">{'{ type: "string" }'}</code>
            <p className="text-sm text-muted-foreground mt-1">
              Text input field. Supports format validation (email, uri,
              date-time) and pattern matching. Use{" "}
              <code className="px-1 py-0.5 bg-background rounded text-xs">
                enum
              </code>{" "}
              for predefined choices.
            </p>
          </div>

          <div className="border-l-4 border-accent pl-4 py-2 bg-muted/20 rounded-r">
            <strong className="text-foreground">Integer / Number</strong>
            <code className="ml-2 text-xs">{'{ type: "integer" }'}</code>
            <p className="text-sm text-muted-foreground mt-1">
              Numeric input with validation. Supports{" "}
              <code className="px-1 py-0.5 bg-background rounded text-xs">
                minimum
              </code>
              ,{" "}
              <code className="px-1 py-0.5 bg-background rounded text-xs">
                maximum
              </code>
              ,{" "}
              <code className="px-1 py-0.5 bg-background rounded text-xs">
                multipleOf
              </code>{" "}
              constraints.
            </p>
          </div>

          <div className="border-l-4 border-accent pl-4 py-2 bg-muted/20 rounded-r">
            <strong className="text-foreground">Enum</strong>
            <code className="ml-2 text-xs">
              {'{ type: "string", enum: [...] }'}
            </code>
            <p className="text-sm text-muted-foreground mt-1">
              Dropdown or radio group for predefined choices. Use{" "}
              <code className="px-1 py-0.5 bg-background rounded text-xs">
                enumNames
              </code>{" "}
              for display labels.
            </p>
          </div>
        </div>
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
