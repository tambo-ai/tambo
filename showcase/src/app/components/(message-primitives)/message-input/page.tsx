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
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export default function MessageInputPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Input
        </h1>
        <p className="text-lg text-muted-foreground">
          A primitive component for handling message input with textarea,
          toolbar, submit button, and error display. Provides form submission
          and state management for chat interfaces. Supports file attachments
          including images, PDFs, and text files.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>
        <div className="space-y-6">
          <ComponentCodePreview
            title="Default Message Input with File Attachments"
            component={
              <MessageInput variant="default">
                <MessageInputTextarea placeholder="Type your message or attach files..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function ChatInput() {
  // Default: accepts images, PDFs, and text files
  return (
    <MessageInput variant="default">
      <MessageInputTextarea placeholder="Type your message or paste images or attach files..." />
      <MessageInputToolbar>
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="Images Only (File Type Filtering)"
            component={
              <MessageInput variant="default">
                <MessageInputTextarea placeholder="Type your message or paste images..." />
                <MessageInputToolbar>
                  <MessageInputFileButton
                    accept="image/*"
                    tooltip="Attach Images"
                  />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function ImagesOnlyInput() {
  // Filter to only allow image uploads
  return (
    <MessageInput variant="default">
      <MessageInputTextarea placeholder="Type your message or paste images..." />
      <MessageInputToolbar>
        <MessageInputFileButton accept="image/*" tooltip="Attach Images" />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="PDFs Only"
            component={
              <MessageInput variant="default">
                <MessageInputTextarea placeholder="Type your message or attach a PDF..." />
                <MessageInputToolbar>
                  <MessageInputFileButton
                    accept="application/pdf"
                    tooltip="Attach PDF"
                  />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function PdfOnlyInput() {
  // Filter to only allow PDF uploads
  return (
    <MessageInput variant="default">
      <MessageInputTextarea placeholder="Type your message or attach a PDF..." />
      <MessageInputToolbar>
        <MessageInputFileButton accept="application/pdf" tooltip="Attach PDF" />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="Solid Variant"
            component={
              <MessageInput variant="solid">
                <MessageInputTextarea placeholder="Type your message or attach files..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function SolidChatInput() {
  return (
    <MessageInput variant="solid">
      <MessageInputTextarea placeholder="Type your message or attach files..." />
      <MessageInputToolbar>
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="Bordered Variant"
            component={
              <MessageInput variant="bordered">
                <MessageInputTextarea placeholder="Type your message or attach files..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function BorderedChatInput() {
  return (
    <MessageInput variant="bordered">
      <MessageInputTextarea placeholder="Type your message or attach files..." />
      <MessageInputToolbar>
        <MessageInputFileButton />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="Full-featured: MCP Config + File Attachments"
            component={
              <MessageInput variant="default">
                <MessageInputTextarea placeholder="Type your message or attach files..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
                  <MessageInputMcpConfigButton />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputToolbar,
} from "@/components/tambo/message-input";

export function FullFeaturedInput() {
  return (
    <MessageInput variant="default">
      <MessageInputTextarea placeholder="Type your message or attach files..." />
      <MessageInputToolbar>
        <MessageInputFileButton />
        <MessageInputMcpConfigButton />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />

          <ComponentCodePreview
            title="Minimal Input (No Toolbar)"
            component={
              <MessageInput>
                <MessageInputTextarea placeholder="Simple message input..." />
                <MessageInputError />
              </MessageInput>
            }
            code={`import {
  MessageInput,
  MessageInputTextarea,
  MessageInputError,
} from "@/components/tambo/message-input";

export function MinimalInput() {
  return (
    <MessageInput>
      <MessageInputTextarea placeholder="Simple message input..." />
      <MessageInputError />
    </MessageInput>
  );
}`}
            previewClassName="flex flex-col justify-end gap-4 p-4"
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add message-input" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">MessageInput</h3>

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
                  <td>variant</td>
                  <td>
                    &quot;default&quot; | &quot;solid&quot; |
                    &quot;bordered&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Optional styling variant for the input container</td>
                </tr>
                <tr>
                  <td>children</td>
                  <td>React.ReactNode</td>
                  <td>-</td>
                  <td>
                    The child elements to render within the form container
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">MessageInputFileButton</h3>

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
                  <td>accept</td>
                  <td>string</td>
                  <td>All supported types</td>
                  <td>
                    MIME types or file extensions to accept. Use{" "}
                    <code>&quot;image/*&quot;</code> for images only,{" "}
                    <code>&quot;application/pdf&quot;</code> for PDFs only.
                  </td>
                </tr>
                <tr>
                  <td>multiple</td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Allow multiple file selection</td>
                </tr>
                <tr>
                  <td>tooltip</td>
                  <td>string</td>
                  <td>Based on accept</td>
                  <td>
                    Custom tooltip text. Defaults to &quot;Attach Files&quot; or
                    &quot;Attach Images&quot; based on accept type.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Other Sub-components</h3>

            <ul>
              <li>
                <strong>MessageInputTextarea</strong> - The main text input area
                where users type their messages. Automatically resizes based on
                content and handles keyboard shortcuts for submission. Supports
                file pasting from clipboard.
              </li>
              <li>
                <strong>MessageInputStagedFiles</strong> - Displays currently
                staged files with preview (for images) and remove functionality.
                Automatically shows when files are attached.
              </li>
              <li>
                <strong>MessageInputMcpConfigButton</strong> - Button to open
                the MCP configuration modal which allows you to configure
                client-side MCP servers. You can add or remove this button from
                the toolbar.
              </li>
              <li>
                <strong>MessageInputSubmitButton</strong> - Button to submit the
                message form. Shows loading state during submission and is
                disabled when input is empty.
              </li>
              <li>
                <strong>MessageInputError</strong> - Displays error messages
                when message submission fails. Automatically shows/hides based
                on submission state.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Supported File Types</h3>
            <ul>
              <li>
                <strong>Images</strong>: JPEG, PNG, GIF, WebP
              </li>
              <li>
                <strong>Documents</strong>: PDF
              </li>
              <li>
                <strong>Text</strong>: TXT, MD, CSV, HTML, JS, TS, JSON, XML
              </li>
            </ul>
            <p className="text-muted-foreground">
              Maximum file size: 50MB per file, 100MB total. Up to 10 files at
              once.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
