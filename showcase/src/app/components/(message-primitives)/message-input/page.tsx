"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
} from "@/components/ui/message-input";

export default function MessageInputPage() {
  return (
    <div className="prose max-w-full">
      <h1>Message Input</h1>
      <p className="text-lg text-muted-foreground">
        A primitive component for handling message input with textarea, toolbar,
        submit button, and error display. Provides form submission and state
        management for chat interfaces.
      </p>

      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Default Message Input with Image Attachments"
        component={
          <MessageInput contextKey="demo-default" variant="default">
            <MessageInputTextarea placeholder="Type your message or paste images..." />
            <div className="flex justify-between items-center mt-2 p-1 gap-2">
              <MessageInputFileButton />
              <MessageInputSubmitButton />
            </div>
            <MessageInputError />
          </MessageInput>
        }
        code={`import { MessageInput, MessageInputTextarea, MessageInputFileButton, MessageInputSubmitButton, MessageInputError } from "@tambo-ai/react";

export function ChatInput() {
  return (
    <MessageInput contextKey="my-thread" variant="default">
      <MessageInputTextarea placeholder="Type your message or paste images..." />
      <div className="flex justify-between items-center mt-2 p-1 gap-2">
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </div>
      <MessageInputError />
    </MessageInput>
  );
}`}
        previewClassName="p-4"
      />

      <ComponentCodePreview
        title="Solid Variant"
        component={
          <MessageInput contextKey="demo-solid" variant="solid">
            <MessageInputTextarea placeholder="Type your message or paste images..." />
            <div className="flex justify-between items-center mt-2 p-1 gap-2">
              <MessageInputFileButton />
              <MessageInputSubmitButton />
            </div>
            <MessageInputError />
          </MessageInput>
        }
        code={`import { MessageInput, MessageInputTextarea, MessageInputFileButton, MessageInputSubmitButton, MessageInputError } from "@tambo-ai/react";

export function SolidChatInput() {
  return (
    <MessageInput contextKey="my-thread" variant="solid">
      <MessageInputTextarea placeholder="Type your message or paste images..." />
      <div className="flex justify-between items-center mt-2 p-1 gap-2">
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </div>
      <MessageInputError />
    </MessageInput>
  );
}`}
        previewClassName="p-4"
      />

      <ComponentCodePreview
        title="Bordered Variant"
        component={
          <MessageInput contextKey="demo-bordered" variant="bordered">
            <MessageInputTextarea placeholder="Type your message or paste images..." />
            <div className="flex justify-between items-center mt-2 p-1 gap-2">
              <MessageInputFileButton />
              <MessageInputSubmitButton />
            </div>
            <MessageInputError />
          </MessageInput>
        }
        code={`import { MessageInput, MessageInputTextarea, MessageInputFileButton, MessageInputSubmitButton, MessageInputError } from "@tambo-ai/react";

export function BorderedChatInput() {
  return (
    <MessageInput contextKey="my-thread" variant="bordered">
      <MessageInputTextarea placeholder="Type your message or paste images..." />
      <div className="flex justify-between items-center mt-2 p-1 gap-2">
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </div>
      <MessageInputError />
    </MessageInput>
  );
}`}
        previewClassName="p-4"
      />

      <ComponentCodePreview
        title="Full-featured: MCP Config + Image Attachments"
        component={
          <MessageInput contextKey="demo-mcp" variant="default">
            <MessageInputTextarea placeholder="Type your message or paste images..." />
            <div className="flex justify-between items-center mt-2 p-1 gap-2">
              <div className="flex items-center gap-2">
                <MessageInputFileButton />
                <MessageInputMcpConfigButton />
              </div>
              <div className="flex items-center gap-2">
                <MessageInputSubmitButton />
              </div>
            </div>
            <MessageInputError />
          </MessageInput>
        }
        code={`import { MessageInput, MessageInputTextarea, MessageInputFileButton, MessageInputMcpConfigButton, MessageInputSubmitButton, MessageInputError } from "@tambo-ai/react";

export function FullFeaturedInput() {
  return (
    <MessageInput contextKey="my-thread" variant="default">
      <MessageInputTextarea placeholder="Type your message or paste images..." />
      <div className="flex justify-between items-center mt-2 p-1 gap-2">
        <div className="flex items-center gap-2">
          <MessageInputFileButton />
          <MessageInputMcpConfigButton />
        </div>
        <MessageInputSubmitButton />
      </div>
      <MessageInputError />
    </MessageInput>
  );
}`}
        previewClassName="p-4"
      />

      <ComponentCodePreview
        title="Minimal Input (No Toolbar)"
        component={
          <MessageInput contextKey="demo-minimal">
            <MessageInputTextarea placeholder="Simple message input..." />
            <MessageInputError />
          </MessageInput>
        }
        code={`import { MessageInput, MessageInputTextarea, MessageInputError } from "@tambo-ai/react";

export function MinimalInput() {
  return (
    <MessageInput contextKey="my-thread">
      <MessageInputTextarea placeholder="Simple message input..." />
      <MessageInputError />
    </MessageInput>
  );
}`}
        previewClassName="p-4"
      />

      <InstallationSection cliCommand="npx tambo add message-input" />

      <h2 className="mt-12">Component API</h2>

      <h3>MessageInput</h3>

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
            <td>contextKey</td>
            <td>string</td>
            <td>-</td>
            <td>
              The context key identifying which thread to send messages to
            </td>
          </tr>
          <tr>
            <td>variant</td>
            <td>
              &quot;default&quot; | &quot;solid&quot; | &quot;bordered&quot;
            </td>
            <td>&quot;default&quot;</td>
            <td>Optional styling variant for the input container</td>
          </tr>
          <tr>
            <td>children</td>
            <td>React.ReactNode</td>
            <td>-</td>
            <td>The child elements to render within the form container</td>
          </tr>
        </tbody>
      </table>

      <h3>Sub-components</h3>

      <ul>
        <li>
          <strong>MessageInputTextarea</strong> - The main text input area where
          users type their messages. Automatically resizes based on content and
          handles keyboard shortcuts for submission. Supports image pasting from
          clipboard.
        </li>
        <li>
          <strong>MessageInputFileButton</strong> - Button to open file picker
          for selecting images to attach to messages. Supports multiple image
          selection and validates file types and sizes.
        </li>
        <li>
          <strong>MessageInputMcpConfigButton</strong> - Button to open the MCP
          configuration modal which allows you to configure client-side MCP
          servers. You can add or remove this button from the toolbar.
        </li>
        <li>
          <strong>MessageInputSubmitButton</strong> - Button to submit the
          message form. Shows loading state during submission and is disabled
          when input is empty.
        </li>
        <li>
          <strong>MessageInputError</strong> - Displays error messages when
          message submission fails. Automatically shows/hides based on
          submission state.
        </li>
      </ul>
    </div>
  );
}
