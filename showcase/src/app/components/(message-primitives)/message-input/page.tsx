"use client";

import { CLI } from "@/components/cli";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/ui/message-input";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

export default function MessageInputPage() {
  const usageCode = `import { 
  MessageInput, 
  MessageInputTextarea, 
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError 
} from "@/components/ui/message-input";

// Basic usage
<MessageInput contextKey="my-thread" variant="default">
  <MessageInputTextarea />
  <MessageInputToolbar>
    <MessageInputSubmitButton />
  </MessageInputToolbar>
  <MessageInputError />
</MessageInput>

// With solid variant
<MessageInput contextKey="my-thread" variant="solid">
  <MessageInputTextarea placeholder="Type your message..." />
  <MessageInputToolbar>
    <MessageInputSubmitButton />
  </MessageInputToolbar>
</MessageInput>`;

  const installCommand = "npx tambo add message-input";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Message Input</h1>
            <p className="text-lg text-secondary mb-6">
              A primitive component for handling message input with textarea,
              toolbar, submit button, and error display. Provides form
              submission and state management for chat interfaces.
            </p>
          </div>

          {/* Installation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
            <p className="text-sm text-muted-foreground italic mt-2">
              Note: This component is automatically included when you install
              any of the &quot;Message Thread&quot; blocks.
            </p>
          </div>

          {/* Sub-components */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Sub-components</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <ul className="space-y-3 text-sm">
                <li>
                  <strong>
                    <code>&lt;MessageInputTextarea /&gt;</code> -
                  </strong>{" "}
                  The main text input area where users type their messages.
                  Automatically resizes based on content and handles keyboard
                  shortcuts for submission.
                </li>
                <li>
                  <strong>
                    <code>&lt;MessageInputToolbar /&gt;</code> -
                  </strong>{" "}
                  Container for toolbar elements positioned alongside the input.
                  Typically contains the submit button and other action buttons.
                </li>
                <li>
                  <strong>
                    <code>&lt;MessageInputSubmitButton /&gt;</code> -
                  </strong>{" "}
                  Button to submit the message form. Shows loading state during
                  submission and is disabled when input is empty.
                </li>
                <li>
                  <strong>
                    <code>&lt;MessageInputError /&gt;</code> -
                  </strong>{" "}
                  Displays error messages when message submission fails.
                  Automatically shows/hides based on submission state.
                </li>
              </ul>
            </div>
          </div>

          {/* Sample Code */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <SyntaxHighlighter code={usageCode} language="tsx" />
          </div>

          {/* Default Variant Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Default Message Input</h3>
            <div className="p-4 border rounded-lg bg-white">
              <MessageInput contextKey="demo-default" variant="default">
                <MessageInputTextarea placeholder="Type your message..." />
                <MessageInputToolbar>
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* Solid Variant Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Solid Variant</h3>
            <div className="p-4 border rounded-lg bg-white">
              <MessageInput contextKey="demo-solid" variant="solid">
                <MessageInputTextarea placeholder="Type your message..." />
                <MessageInputToolbar>
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* Bordered Variant Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Bordered Variant</h3>
            <div className="p-4 border rounded-lg bg-white">
              <MessageInput contextKey="demo-bordered" variant="bordered">
                <MessageInputTextarea placeholder="Type your message..." />
                <MessageInputToolbar>
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* Minimal Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Minimal Input (No Toolbar)
            </h3>
            <div className="p-4 border rounded-lg bg-white">
              <MessageInput contextKey="demo-minimal">
                <MessageInputTextarea placeholder="Simple message input..." />
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* Props Documentation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Props</h2>

            <h3 className="text-lg font-medium mb-3">MessageInput</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Prop</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono">contextKey</td>
                    <td className="py-2">string</td>
                    <td className="py-2">
                      The context key identifying which thread to send messages
                      to
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">variant</td>
                    <td className="py-2">
                      &quot;default&quot; | &quot;solid&quot; |
                      &quot;bordered&quot;
                    </td>
                    <td className="py-2">
                      Optional styling variant for the input container
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">children</td>
                    <td className="py-2">React.ReactNode</td>
                    <td className="py-2">
                      The child elements to render within the form container
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
