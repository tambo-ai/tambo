"use client";

import { CLI } from "@/components/cli";
import { ElicitationUI } from "@/components/ui/elicitation-ui";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import type { TamboElicitationResponse } from "@tambo-ai/react/mcp";
import { useState } from "react";

export default function ElicitationPage() {
  // Track responses for each example
  const [responses, setResponses] = useState<Record<string, string>>({});

  const handleResponse = (key: string, response: TamboElicitationResponse) => {
    setResponses((prev) => ({
      ...prev,
      [key]: JSON.stringify(response, null, 2),
    }));
  };

  // Helper component to show request JSON
  const RequestDisclosure = ({ request }: { request: unknown }) => (
    <details className="mb-3 border-b border-border pb-3">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
        View Request JSON
      </summary>
      <div className="mt-2 p-3 bg-muted rounded text-xs">
        <pre className="text-foreground/70 overflow-x-auto">
          {JSON.stringify(request, null, 2)}
        </pre>
      </div>
    </details>
  );

  const usageCode = `import { ElicitationUI } from "@/components/ui/elicitation-ui";
import { useTamboElicitationContext } from "@tambo-ai/react/mcp";

// This example shows how the Elicitation UI would be used inside your Tambo app
function MyElicitationComponent() {
  const { request, onResponse } = useTamboElicitationContext();
  
  if (!request) {
    return null;
  }
  
  return (
    <ElicitationUI 
      request={request} 
      onResponse={onResponse}
    />
  );
}`;

  const installCommand = "npx tambo add elicitation-ui";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            MCP Elicitation UI
          </h1>
          <p className="text-muted-foreground text-lg">
            Human-in-the-loop interaction component for MCP (Model Context
            Protocol) servers to request clarification, disambiguation, or user
            input during workflows.
          </p>
        </div>

        {/* Installation */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Installation</h2>
          <div className="bg-muted rounded-lg p-4 mb-3 text-sm">
            <p className="font-semibold mb-2">Note:</p>
            <p>
              The Elicitation UI is <strong>automatically included</strong> when
              you add the{" "}
              <code className="px-1 py-0.5 bg-background rounded">
                message-input
              </code>{" "}
              component. You don&apos;t need to install it separately unless you
              want to use it standalone.
            </p>
          </div>
          <CLI command={installCommand} />
        </div>

        {/* Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <p>
              The Elicitation UI component enables MCP servers to pause their
              workflow and request input from users through the Model Context
              Protocol. When an MCP server sends an elicitation request, this
              component renders the appropriate UI for collecting user
              responses. This is critical for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Clarifying ambiguous instructions</li>
              <li>Getting user preferences when multiple options exist</li>
              <li>Requesting permissions for sensitive actions</li>
              <li>Gathering missing information needed to proceed</li>
              <li>Validating assumptions before taking action</li>
            </ul>
            <p className="pt-2">
              The component integrates with the MCP elicitation protocol and
              supports various field types, automatically adapting its UI based
              on the JSON Schema provided in the elicitation request. For simple
              yes/no or single-choice questions, it uses a streamlined
              single-entry mode that submits immediately upon selection.
            </p>
          </div>
        </div>

        {/* Usage */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Usage</h2>
          <div className="bg-muted rounded-lg p-4 mb-4 text-sm">
            <p>
              <strong>Note:</strong> The Elicitation UI is automatically
              rendered by the{" "}
              <code className="px-1 py-0.5 bg-background rounded">
                MessageInput
              </code>{" "}
              component when an MCP server sends an elicitation request through
              the Model Context Protocol. The code below shows how you would use
              it if building a custom UI component.
            </p>
          </div>
          <SyntaxHighlighter code={usageCode} language="tsx" />
        </div>

        {/* Examples Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Examples</h2>

          {/* Behavioral Note */}
          <div className="bg-muted rounded-lg p-4 mb-6 text-sm">
            <p className="font-semibold mb-2">Note on UI Behavior:</p>
            <p className="mb-2">
              When there is <strong>only one question</strong> that is an{" "}
              <strong>enum or boolean</strong>, the UI automatically enters{" "}
              <strong>single-entry mode</strong> with no Submit button. The form
              submits immediately when you make a selection.
            </p>
            <p>
              When there are <strong>multiple fields</strong> or the field type
              is <strong>text/number</strong>, the UI displays Submit, Decline,
              and Cancel buttons. The Submit button is disabled until all
              required fields are valid.
            </p>
          </div>

          {/* Boolean Confirmation */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">
              1. Permission Request (Boolean)
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP server asks for permission before performing a potentially
              destructive action.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "I'm about to delete 47 old log files. Should I proceed?",
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
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "I'm about to delete 47 old log files. Should I proceed?",
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
                }}
                onResponse={(response) => handleResponse("delete", response)}
              />
              {responses["delete"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["delete"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Enum Choice - Disambiguation */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">
              2. Disambiguation (Multiple Choice)
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP server needs clarification when user&apos;s intent is
              ambiguous.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    'You mentioned "Python setup" - what would you like me to help with?',
                  requestedSchema: {
                    type: "object",
                    properties: {
                      task: {
                        type: "string",
                        description: "Select the task",
                        enum: [
                          "install",
                          "configure_env",
                          "setup_venv",
                          "install_deps",
                        ],
                        enumNames: [
                          "Install Python",
                          "Configure environment variables",
                          "Set up virtual environment",
                          "Install project dependencies",
                        ],
                      },
                    },
                    required: ["task"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    'You mentioned "Python setup" - what would you like me to help with?',
                  requestedSchema: {
                    type: "object",
                    properties: {
                      task: {
                        type: "string",
                        description: "Select the task",
                        enum: [
                          "install",
                          "configure_env",
                          "setup_venv",
                          "install_deps",
                        ],
                        enumNames: [
                          "Install Python",
                          "Configure environment variables",
                          "Set up virtual environment",
                          "Install project dependencies",
                        ],
                      },
                    },
                    required: ["task"],
                  },
                }}
                onResponse={(response) =>
                  handleResponse("python-task", response)
                }
              />
              {responses["python-task"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["python-task"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Text Input with Validation */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">
              3. Missing Information (Text Input)
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP server needs specific information to proceed with the task.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "I need the API endpoint URL to configure the integration. What URL should I use?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      apiUrl: {
                        type: "string",
                        description: "API endpoint URL",
                        format: "uri",
                      },
                    },
                    required: ["apiUrl"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "I need the API endpoint URL to configure the integration. What URL should I use?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      apiUrl: {
                        type: "string",
                        description: "API endpoint URL",
                        format: "uri",
                      },
                    },
                    required: ["apiUrl"],
                  },
                }}
                onResponse={(response) => handleResponse("api-url", response)}
              />
              {responses["api-url"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["api-url"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Number Input */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">4. Numeric Parameter</h3>
            <p className="text-sm text-muted-foreground">
              MCP server asks for a numeric value with constraints.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "How many concurrent workers should I use for this batch job?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      workers: {
                        type: "integer",
                        description: "Number of workers (1-16)",
                        minimum: 1,
                        maximum: 16,
                        default: 4,
                      },
                    },
                    required: ["workers"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "How many concurrent workers should I use for this batch job?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      workers: {
                        type: "integer",
                        description: "Number of workers (1-16)",
                        minimum: 1,
                        maximum: 16,
                        default: 4,
                      },
                    },
                    required: ["workers"],
                  },
                }}
                onResponse={(response) => handleResponse("workers", response)}
              />
              {responses["workers"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["workers"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Multiple Fields */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">
              5. Multiple Fields (Complex Input)
            </h3>
            <p className="text-sm text-muted-foreground">
              MCP server needs several pieces of information to configure a
              feature.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "I need a few details to set up the new database connection:",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      host: {
                        type: "string",
                        description: "Database host",
                        default: "localhost",
                      },
                      port: {
                        type: "integer",
                        description: "Port number",
                        minimum: 1,
                        maximum: 65535,
                        default: 5432,
                      },
                      database: {
                        type: "string",
                        description: "Database name",
                        minLength: 1,
                      },
                      ssl: {
                        type: "boolean",
                        description: "Use SSL connection",
                      },
                    },
                    required: ["host", "port", "database", "ssl"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "I need a few details to set up the new database connection:",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      host: {
                        type: "string",
                        description: "Database host",
                        default: "localhost",
                      },
                      port: {
                        type: "integer",
                        description: "Port number",
                        minimum: 1,
                        maximum: 65535,
                        default: 5432,
                      },
                      database: {
                        type: "string",
                        description: "Database name",
                        minLength: 1,
                      },
                      ssl: {
                        type: "boolean",
                        description: "Use SSL connection",
                      },
                    },
                    required: ["host", "port", "database", "ssl"],
                  },
                }}
                onResponse={(response) => handleResponse("database", response)}
              />
              {responses["database"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["database"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">6. Email Validation</h3>
            <p className="text-sm text-muted-foreground">
              MCP server requests contact information with built-in validation.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "What email address should I send the report summary to?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      email: {
                        type: "string",
                        description: "Email address",
                        format: "email",
                      },
                    },
                    required: ["email"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "What email address should I send the report summary to?",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      email: {
                        type: "string",
                        description: "Email address",
                        format: "email",
                      },
                    },
                    required: ["email"],
                  },
                }}
                onResponse={(response) => handleResponse("email", response)}
              />
              {responses["email"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["email"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Optional Field */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">7. Optional Information</h3>
            <p className="text-sm text-muted-foreground">
              MCP server asks for optional details to enhance the result.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "I can generate a more detailed report if you provide additional context.",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      includeCharts: {
                        type: "boolean",
                        description: "Include visualizations",
                      },
                      additionalNotes: {
                        type: "string",
                        description: "Additional notes (optional)",
                      },
                    },
                    required: ["includeCharts"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "I can generate a more detailed report if you provide additional context.",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      includeCharts: {
                        type: "boolean",
                        description: "Include visualizations",
                      },
                      additionalNotes: {
                        type: "string",
                        description: "Additional notes (optional)",
                      },
                    },
                    required: ["includeCharts"],
                  },
                }}
                onResponse={(response) => handleResponse("report", response)}
              />
              {responses["report"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["report"]}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Deployment Confirmation */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium">8. Deployment Configuration</h3>
            <p className="text-sm text-muted-foreground">
              MCP server asks for deployment parameters before proceeding with a
              release.
            </p>
            <div className="p-4 border rounded-lg bg-card">
              <RequestDisclosure
                request={{
                  message:
                    "Ready to deploy to production. Please confirm the deployment settings:",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      environment: {
                        type: "string",
                        description: "Target environment",
                        enum: ["staging", "production"],
                        enumNames: ["Staging (safe)", "Production (live)"],
                      },
                      runMigrations: {
                        type: "boolean",
                        description: "Run database migrations",
                      },
                      rollbackOnError: {
                        type: "boolean",
                        description: "Auto-rollback on error",
                        default: true,
                      },
                    },
                    required: ["environment", "runMigrations"],
                  },
                }}
              />
              <ElicitationUI
                request={{
                  message:
                    "Ready to deploy to production. Please confirm the deployment settings:",
                  requestedSchema: {
                    type: "object",
                    properties: {
                      environment: {
                        type: "string",
                        description: "Target environment",
                        enum: ["staging", "production"],
                        enumNames: ["Staging (safe)", "Production (live)"],
                      },
                      runMigrations: {
                        type: "boolean",
                        description: "Run database migrations",
                      },
                      rollbackOnError: {
                        type: "boolean",
                        description: "Auto-rollback on error",
                        default: true,
                      },
                    },
                    required: ["environment", "runMigrations"],
                  },
                }}
                onResponse={(response) =>
                  handleResponse("deployment", response)
                }
              />
              {responses["deployment"] && (
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="font-semibold mb-1">Response:</div>
                  <pre className="text-foreground/70 overflow-x-auto">
                    {responses["deployment"]}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Props Documentation */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Props</h2>
          <div className="bg-muted rounded-lg p-4 space-y-3 text-sm">
            <div>
              <strong>request</strong>
              <code className="ml-2 text-xs">TamboElicitationRequest</code>
              <p className="text-foreground/70 mt-1">
                The elicitation request object containing the message and
                requested schema (JSON Schema format).
              </p>
            </div>
            <div>
              <strong>onResponse</strong>
              <code className="ml-2 text-xs">
                (response: TamboElicitationResponse) =&gt; void
              </code>
              <p className="text-foreground/70 mt-1">
                Callback function called when the user responds. The response
                includes an action (&quot;accept&quot;, &quot;decline&quot;, or
                &quot;cancel&quot;) and optional content with the user&apos;s
                input.
              </p>
            </div>
            <div>
              <strong>className</strong>
              <code className="ml-2 text-xs">string (optional)</code>
              <p className="text-foreground/70 mt-1">
                Additional CSS classes to apply to the component.
              </p>
            </div>
          </div>
        </div>

        {/* Schema Reference */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Schema Reference</h2>
          <div className="bg-muted rounded-lg p-4 space-y-4 text-sm">
            <p>
              The component uses JSON Schema to define the structure of the
              elicitation request. Supported field types:
            </p>

            <div className="space-y-3">
              <div className="border-l-2 border-border pl-4">
                <strong>Boolean</strong>
                <code className="ml-2 text-xs">{`{ type: "boolean" }`}</code>
                <p className="text-foreground/70 mt-1">
                  Renders as Yes/No buttons. Single-entry mode with immediate
                  submission.
                </p>
              </div>

              <div className="border-l-2 border-border pl-4">
                <strong>String (enum)</strong>
                <code className="ml-2 text-xs">{`{ type: "string", enum: [...] }`}</code>
                <p className="text-foreground/70 mt-1">
                  Renders as multiple choice buttons. Single-entry mode with
                  immediate submission. Use <code>enumNames</code> for custom
                  labels.
                </p>
              </div>

              <div className="border-l-2 border-border pl-4">
                <strong>String</strong>
                <code className="ml-2 text-xs">{`{ type: "string" }`}</code>
                <p className="text-foreground/70 mt-1">
                  Renders as text input. Supports validation: minLength,
                  maxLength, pattern. Supports formats: email, uri, date,
                  date-time.
                </p>
              </div>

              <div className="border-l-2 border-border pl-4">
                <strong>Number / Integer</strong>
                <code className="ml-2 text-xs">{`{ type: "number" }`}</code>
                <p className="text-foreground/70 mt-1">
                  Renders as number input. Supports minimum and maximum
                  constraints. Integer type enforces whole numbers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <strong>Common schema properties:</strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-foreground/70">
                <li>
                  <code>description</code> - Field label (falls back to field
                  name)
                </li>
                <li>
                  <code>default</code> - Pre-populated default value
                </li>
                <li>
                  <code>required</code> - Array of required field names
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Behavior Notes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Behavior</h2>
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <p>
              <strong>Single-Entry Mode:</strong> When the elicitation contains
              exactly one field of type boolean or string enum, the UI
              automatically switches to single-entry mode with immediate
              submission on selection. This streamlines simple yes/no or
              multiple-choice questions.
            </p>
            <p>
              <strong>Multiple-Entry Mode:</strong> When multiple fields are
              present or when using text/number inputs, the UI displays all
              fields with Submit, Decline, and Cancel buttons. Submit is
              disabled until all required fields are valid.
            </p>
            <p>
              <strong>Validation:</strong> Real-time validation is shown after a
              field is touched (interacted with). Errors are displayed inline
              beneath each field. The Submit button is disabled until all
              validations pass.
            </p>
            <p>
              <strong>Response Actions:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/70">
              <li>
                <code>accept</code> - User provided input and confirmed
              </li>
              <li>
                <code>decline</code> - User explicitly declined to provide input
              </li>
              <li>
                <code>cancel</code> - User cancelled the entire operation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
