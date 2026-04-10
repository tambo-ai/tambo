"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { InputFieldsChatInterface } from "@/components/generative/InputFieldsChatInterface";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { InputFields } from "@tambo-ai/ui-registry/components/input-fields";

export default function InputFieldsComponentPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Input Fields
        </h1>
        <p className="text-lg text-muted-foreground">
          A focused collection of input fields optimized for data entry and user
          information capture with advanced validation, autocomplete support,
          and comprehensive field types. Perfect for building registration
          forms, profile editors, and data collection interfaces.
        </p>
      </header>

      {/* Example Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Example</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="User Registration Fields"
            component={
              <InputFields
                fields={[
                  {
                    id: "username",
                    label: "Username",
                    type: "text",
                    required: true,
                    placeholder: "Enter username",
                    minLength: 3,
                    maxLength: 20,
                    pattern: "^[a-zA-Z0-9]+$",
                    description: "Must be 3-20 alphanumeric characters",
                    autoComplete: "username",
                  },
                  {
                    id: "email",
                    label: "Email",
                    type: "email",
                    required: true,
                    placeholder: "your.email@example.com",
                    description: "We'll use this for account notifications",
                    autoComplete: "email",
                  },
                  {
                    id: "password",
                    label: "Password",
                    type: "password",
                    required: true,
                    placeholder: "Create strong password",
                    minLength: 8,
                    maxLength: 128,
                    description: "Must be at least 8 characters long",
                    autoComplete: "new-password",
                  },
                  {
                    id: "age",
                    label: "Age",
                    type: "number",
                    placeholder: "25",
                    minLength: 1,
                    maxLength: 3,
                    description: "Must be between 1-150",
                  },
                ]}
                variant="solid"
                layout="compact"
              />
            }
            code={`import { InputFields } from "@/components/tambo/input-fields";

export function UserRegistrationFields() {
  return (
    <InputFields
      fields={[
        {
          id: "username",
          label: "Username",
          type: "text",
          required: true,
          placeholder: "Enter username",
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9]+$",
          description: "Must be 3-20 alphanumeric characters",
          autoComplete: "username",
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "your.email@example.com",
          description: "We'll use this for account notifications",
          autoComplete: "email",
        },
        {
          id: "password",
          label: "Password",
          type: "password",
          required: true,
          placeholder: "Create strong password",
          minLength: 8,
          maxLength: 128,
          description: "Must be at least 8 characters long",
          autoComplete: "new-password",
        },
        {
          id: "age",
          label: "Age",
          type: "number",
          placeholder: "25",
          minLength: 1,
          maxLength: 3,
          description: "Must be between 1-150",
        },
      ]}
      variant="solid"
      layout="compact"
    />
  );
}`}
            previewClassName="p-8"
          />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Interactive Demo</h2>

        <p className="text-sm text-muted-foreground">
          Use natural language to generate and modify input fields in real time.
          This interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="AI-Generated Input Fields"
            component={<InputFieldsChatInterface />}
            code={`import {
  InputFields,
  inputFieldsSchema,
} from "@/components/tambo/input-fields";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function InputFieldsDemo() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "InputFields",
      description: "A focused collection of input fields.",
      component: InputFields,
      propsSchema: inputFieldsSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
            previewClassName="p-0"
            minHeight={700}
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add input-fields" />
      </section>

      {/* Try It Yourself */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Try It Yourself</h2>

        <div className="not-prose space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              1. Install the component
            </h3>
            <pre className="rounded-md border border-border bg-muted/40 p-4">
              <code className="text-sm text-foreground">
                npx tambo add input-fields
              </code>
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              2. Register with Tambo
            </h3>
            <SyntaxHighlighter
              language="tsx"
              code={`import {
  InputFields,
  inputFieldsSchema,
} from "@/components/tambo/input-fields";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function App() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "InputFields",
      description: "A focused collection of input fields.",
      component: InputFields,
      propsSchema: inputFieldsSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              3. Send a prompt
            </h3>
            <p className="text-sm text-muted-foreground">
              Try these example prompts:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                &rarr; &quot;Create sign-up fields with email and password
                validation&quot;
              </li>
              <li>
                &rarr; &quot;Add a phone field with pattern validation and
                helper text&quot;
              </li>
              <li>
                &rarr; &quot;Build a profile editor with username, email, and
                age inputs&quot;
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">InputFields</h3>

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
                  <td>fields</td>
                  <td>InputField[]</td>
                  <td>[]</td>
                  <td>Array of input field configurations</td>
                </tr>
                <tr>
                  <td>variant</td>
                  <td>
                    &quot;default&quot; | &quot;solid&quot; |
                    &quot;bordered&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Visual style of the container</td>
                </tr>
                <tr>
                  <td>layout</td>
                  <td>
                    &quot;default&quot; | &quot;compact&quot; |
                    &quot;relaxed&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Spacing between input fields</td>
                </tr>
                <tr>
                  <td>className</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Additional CSS classes for customization</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">InputField</h3>

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
                  <td>id</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Unique identifier for the field</td>
                </tr>
                <tr>
                  <td>type</td>
                  <td>
                    &quot;text&quot; | &quot;email&quot; | &quot;password&quot;
                    | &quot;number&quot;
                  </td>
                  <td>-</td>
                  <td>Type of input field to render</td>
                </tr>
                <tr>
                  <td>label</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Label text displayed above the field</td>
                </tr>
                <tr>
                  <td>placeholder</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Placeholder text shown in empty fields</td>
                </tr>
                <tr>
                  <td>required</td>
                  <td>boolean</td>
                  <td>false</td>
                  <td>Whether the field is required</td>
                </tr>
                <tr>
                  <td>disabled</td>
                  <td>boolean</td>
                  <td>false</td>
                  <td>Whether the field is disabled</td>
                </tr>
                <tr>
                  <td>description</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Helper text displayed below the field</td>
                </tr>
                <tr>
                  <td>minLength</td>
                  <td>number</td>
                  <td>-</td>
                  <td>Minimum character length for validation</td>
                </tr>
                <tr>
                  <td>maxLength</td>
                  <td>number</td>
                  <td>-</td>
                  <td>Maximum character length for validation</td>
                </tr>
                <tr>
                  <td>pattern</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Regular expression pattern for validation</td>
                </tr>
                <tr>
                  <td>autoComplete</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Autocomplete attribute for browser support</td>
                </tr>
                <tr>
                  <td>error</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Error message displayed below the field</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
