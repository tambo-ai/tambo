"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { FormChatInterface } from "@/components/generative/FormChatInterface";
import { InstallationSection } from "@/components/installation-section";
import { FormComponent } from "@tambo-ai/ui-registry/components/form";

export default function FormComponentPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Form
        </h1>
        <p className="text-lg text-muted-foreground">
          A dynamic form builder component that creates structured forms with
          multiple input types, validation, and flexible layouts. Perfect for
          generating contact forms, surveys, and data collection interfaces.
        </p>
      </header>

      {/* Example Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Example</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Contact Form"
            component={
              <FormComponent
                fields={[
                  {
                    id: "name",
                    label: "Name",
                    type: "text",
                    required: true,
                    placeholder: "Enter your name",
                  },
                  {
                    id: "email",
                    label: "Email",
                    type: "email",
                    required: true,
                    placeholder: "your.email@example.com",
                  },
                  {
                    id: "phone",
                    label: "Phone",
                    type: "text",
                    placeholder: "(555) 123-4567",
                  },
                  {
                    id: "message",
                    label: "Message",
                    type: "textarea",
                    required: true,
                    placeholder: "How can we help?",
                  },
                  {
                    id: "contactMethod",
                    label: "Preferred Contact Method",
                    type: "select",
                    options: ["Email", "Phone", "Either"],
                  },
                ]}
                variant="bordered"
                layout="relaxed"
                onSubmit={(data) => console.log(data)}
              />
            }
            code={`import { FormComponent } from "@/components/tambo/form";

export function ContactForm() {
  return (
    <FormComponent
      fields={[
        {
          id: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Enter your name",
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "your.email@example.com",
        },
        {
          id: "phone",
          label: "Phone",
          type: "text",
          placeholder: "(555) 123-4567",
        },
        {
          id: "message",
          label: "Message",
          type: "textarea",
          required: true,
          placeholder: "How can we help?",
        },
        {
          id: "contactMethod",
          label: "Preferred Contact Method",
          type: "select",
          options: ["Email", "Phone", "Either"],
        },
      ]}
      variant="bordered"
      layout="relaxed"
      onSubmit={(data) => console.log(data)}
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
          Use natural language to generate and modify forms in real time. This
          interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="AI-Generated Form"
            component={<FormChatInterface />}
            code={`import { FormComponent, formSchema } from "@/components/tambo/form";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function FormDemo() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "FormComponent",
      description: "A dynamic form builder component.",
      component: FormComponent,
      propsSchema: formSchema,
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
        <InstallationSection cliCommand="npx tambo add form" />
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
                npx tambo add form
              </code>
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              2. Register with Tambo
            </h3>
            <pre className="rounded-md border border-border bg-muted/40 p-4">
              <code className="text-sm text-foreground">
                {`import { FormComponent, formSchema } from "@/components/tambo/form";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function App() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "FormComponent",
      description: "A dynamic form builder component.",
      component: FormComponent,
      propsSchema: formSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
              </code>
            </pre>
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
                &rarr; &quot;Create a contact form with name, email, and message
                fields&quot;
              </li>
              <li>
                &rarr; &quot;Build a survey with radio buttons and a dropdown
                for age range&quot;
              </li>
              <li>
                &rarr; &quot;Make a compact registration form with email and
                password validation&quot;
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
            <h3 className="text-xl font-semibold">Form</h3>

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
                  <td>FormField[]</td>
                  <td>-</td>
                  <td>Array of form field configurations</td>
                </tr>
                <tr>
                  <td>onSubmit</td>
                  <td>(data: Record&lt;string, any&gt;) =&gt; void</td>
                  <td>-</td>
                  <td>Callback function when form is submitted</td>
                </tr>
                <tr>
                  <td>onError</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Optional error message to display</td>
                </tr>
                <tr>
                  <td>submitText</td>
                  <td>string</td>
                  <td>&quot;Submit&quot;</td>
                  <td>Text to display on the submit button</td>
                </tr>
                <tr>
                  <td>variant</td>
                  <td>
                    &quot;default&quot; | &quot;solid&quot; |
                    &quot;bordered&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Visual style of the form container</td>
                </tr>
                <tr>
                  <td>layout</td>
                  <td>
                    &quot;default&quot; | &quot;compact&quot; |
                    &quot;relaxed&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Spacing between form fields</td>
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
            <h3 className="text-xl font-semibold">FormField</h3>

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
                    &quot;text&quot; | &quot;email&quot; | &quot;number&quot; |
                    &quot;select&quot; | &quot;textarea&quot; |
                    &quot;radio&quot; | &quot;checkbox&quot; |
                    &quot;slider&quot; | &quot;yes-no&quot;
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
                  <td>options</td>
                  <td>string[]</td>
                  <td>-</td>
                  <td>Options for select, radio, and checkbox fields</td>
                </tr>
                <tr>
                  <td>required</td>
                  <td>boolean</td>
                  <td>false</td>
                  <td>Whether the field is required</td>
                </tr>
                <tr>
                  <td>description</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Helper text displayed below the field</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
