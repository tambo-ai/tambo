"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { InputFieldsChatInterface } from "@/components/generative/InputFieldsChatInterface";
import { TamboProvider } from "@tambo-ai/react";

export default function InputFieldsComponentPage() {
  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Input Fields</h1>
      <p className="text-lg text-muted-foreground">
        A focused collection of input fields optimized for data entry and user
        information capture with advanced validation, autocomplete support, and
        comprehensive field types. Perfect for building registration forms,
        profile editors, and data collection interfaces.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="User Registration Fields"
        component={
          <TamboProvider
            apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
            tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
          >
            <InputFieldsChatInterface />
          </TamboProvider>
        }
        code={`import { InputFields } from "@tambo-ai/react";

export function UserRegistrationFields() {
  return (
    <InputFields
      title="Create Account"
      fields={[
        {
          name: "username",
          label: "Username",
          type: "text",
          required: true,
          placeholder: "Enter username",
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9]+$",
          description: "Must be 3-20 alphanumeric characters",
          autoComplete: "username"
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "your.email@example.com",
          description: "We'll use this for account notifications",
          autoComplete: "email"
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          placeholder: "Create strong password",
          minLength: 8,
          maxLength: 128,
          description: "Must be at least 8 characters long",
          autoComplete: "new-password"
        },
        {
          name: "phone",
          label: "Phone",
          type: "text",
          placeholder: "(555) 123-4567",
          pattern: "^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$",
          description: "Optional: for account recovery",
          autoComplete: "tel"
        },
        {
          name: "age",
          label: "Age",
          type: "number",
          placeholder: "25",
          minLength: 1,
          maxLength: 3,
          description: "Must be between 1-150"
        }
      ]}
      variant="solid"
      layout="compact"
    />
  );
}`}
        previewClassName="p-8 min-h-[700px]"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add input-fields" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>InputFields</h3>

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
            <td>title</td>
            <td>string</td>
            <td>-</td>
            <td>Section heading displayed at the top</td>
          </tr>
          <tr>
            <td>description</td>
            <td>string</td>
            <td>-</td>
            <td>Optional description text below the title</td>
          </tr>
          <tr>
            <td>fields</td>
            <td>InputField[]</td>
            <td>[]</td>
            <td>Array of input field configurations</td>
          </tr>
          <tr>
            <td>variant</td>
            <td>&quot;solid&quot; | &quot;bordered&quot;</td>
            <td>&quot;solid&quot;</td>
            <td>Visual style of the container</td>
          </tr>
          <tr>
            <td>layout</td>
            <td>&quot;compact&quot; | &quot;relaxed&quot;</td>
            <td>&quot;compact&quot;</td>
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

      <h3>InputField</h3>

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
            <td>name</td>
            <td>string</td>
            <td>-</td>
            <td>Unique identifier for the field</td>
          </tr>
          <tr>
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>Label text displayed above the field</td>
          </tr>
          <tr>
            <td>type</td>
            <td>
              &quot;text&quot; | &quot;email&quot; | &quot;password&quot; |
              &quot;number&quot; | &quot;tel&quot;
            </td>
            <td>&quot;text&quot;</td>
            <td>Type of input field to render</td>
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
            <td>placeholder</td>
            <td>string</td>
            <td>-</td>
            <td>Placeholder text shown in empty fields</td>
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
        </tbody>
      </table>
    </div>
  );
}
