"use client";

import { CLI } from "@/components/cli";
import {
  MessageInput,
  MessageInputError,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputVoiceButton,
} from "@/components/ui/message-input";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider, TamboVoiceInputProvider } from "@tambo-ai/react";

export default function MessageInputPage() {
  const usageCode = `import { 
  MessageInput, 
  MessageInputTextarea, 
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputMcpConfigButton,
  MessageInputVoiceButton,
  MessageInputError 
} from "@/components/ui/message-input";
import { TamboProvider, TamboVoiceInputProvider } from "@tambo-ai/react";

// Basic usage
<MessageInput contextKey="my-thread" variant="default">
  <MessageInputTextarea />
  <MessageInputToolbar>
    <MessageInputSubmitButton />
  </MessageInputToolbar>
  <MessageInputError />
</MessageInput>

// With voice input
<TamboProvider apiKey="your-api-key">
  <MessageInput contextKey="my-thread" variant="default">
    <MessageInputTextarea placeholder="Type or speak your message..." />
    <MessageInputToolbar>
      <MessageInputVoiceButton />
      <MessageInputSubmitButton />
    </MessageInputToolbar>
    <MessageInputError />
  </MessageInput>
</TamboProvider>

// With MCP configuration and voice input
<TamboProvider apiKey="your-api-key">
  <MessageInput contextKey="my-thread" variant="default">
    <MessageInputTextarea />
    <MessageInputToolbar>
      <MessageInputMcpConfigButton />
      <MessageInputVoiceButton />
      <MessageInputSubmitButton />
    </MessageInputToolbar>
    <MessageInputError />
  </MessageInput>
</TamboProvider>

// With real-time voice transcription
<TamboProvider apiKey="your-api-key">
  <TamboVoiceInputProvider realTimeMode={true}>
    <MessageInput contextKey="my-thread" variant="default">
      <MessageInputTextarea placeholder="Speak to see real-time transcription..." />
      <MessageInputToolbar>
        <MessageInputVoiceButton />
        <MessageInputSubmitButton />
      </MessageInputToolbar>
      <MessageInputError />
    </MessageInput>
  </TamboVoiceInputProvider>
</TamboProvider>`;

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
                    <code>&lt;MessageInputMcpConfigButton /&gt;</code> -
                  </strong>{" "}
                  Button to open the MCP configuration modal which allows you to
                  configure client-side MCP servers. You can add or remove this
                  button from the toolbar.
                </li>
                <li>
                  <strong>
                    <code>&lt;MessageInputVoiceButton /&gt;</code> -
                  </strong>{" "}
                  Button for voice input functionality. Allows users to record
                  audio and automatically transcribe it to text. Automatically
                  detects browser support and only renders when the necessary
                  APIs are available.
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
                <div className="flex justify-end items-center mt-2 p-1 gap-2">
                  {/* Add any other tools here */}
                  <MessageInputSubmitButton />
                </div>
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
                <div className="flex justify-end items-center mt-2 p-1 gap-2">
                  {/* Add any other tools here */}
                  <MessageInputSubmitButton />
                </div>
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
                <div className="flex justify-end items-center mt-2 p-1 gap-2">
                  {/* Add any other tools here */}
                  <MessageInputSubmitButton />
                </div>
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* With Voice Input Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">With Voice Input</h3>
            <div className="p-4 border rounded-lg bg-white">
              <TamboProvider apiKey="demo-key">
                <MessageInput contextKey="demo-voice" variant="default">
                  <MessageInputTextarea placeholder="Type or speak your message..." />
                  <div className="flex justify-end items-center mt-2 p-1 gap-2">
                    <MessageInputVoiceButton />
                    <MessageInputSubmitButton />
                  </div>
                  <MessageInputError />
                </MessageInput>
              </TamboProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Voice input requires HTTPS (or localhost), microphone permissions,
              and an OpenAI API key configured in your backend.
            </p>
          </div>

          {/* With MCP configuration button */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              With MCP configuration button
            </h3>
            <div className="p-4 border rounded-lg bg-white">
              <MessageInput contextKey="demo-mcp" variant="default">
                <MessageInputTextarea placeholder="Type your message..." />
                <div className="flex justify-between items-center mt-2 p-1 gap-2">
                  <div className="flex items-center gap-2">
                    <MessageInputMcpConfigButton />
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageInputSubmitButton />
                  </div>
                </div>
                <MessageInputError />
              </MessageInput>
            </div>
          </div>

          {/* Full Featured Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Full Featured (MCP + Voice Input)
            </h3>
            <div className="p-4 border rounded-lg bg-white">
              <TamboProvider apiKey="demo-key">
                <MessageInput contextKey="demo-full" variant="default">
                  <MessageInputTextarea placeholder="Type or speak your message..." />
                  <div className="flex justify-between items-center mt-2 p-1 gap-2">
                    <MessageInputMcpConfigButton />
                    <div className="flex items-center gap-2">
                      <MessageInputVoiceButton />
                      <MessageInputSubmitButton />
                    </div>
                  </div>
                  <MessageInputError />
                </MessageInput>
              </TamboProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This example shows all available toolbar components: MCP
              configuration (left), voice input and submit button (right).
            </p>
          </div>

          {/* Real-Time Voice Input Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Real-Time Voice Transcription
            </h3>
            <div className="p-4 border rounded-lg bg-white">
              <TamboProvider apiKey="demo-key">
                <TamboVoiceInputProvider realTimeMode={true}>
                  <MessageInput contextKey="demo-realtime" variant="default">
                    <MessageInputTextarea placeholder="Speak to see real-time transcription..." />
                    <MessageInputToolbar>
                      <MessageInputVoiceButton />
                      <MessageInputSubmitButton />
                    </MessageInputToolbar>
                    <MessageInputError />
                  </MessageInput>
                </TamboVoiceInputProvider>
              </TamboProvider>
            </div>
            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Real-Time Mode:</strong> Words appear in the text box as
                you speak. This provides a more interactive experience but may
                be less accurate than batch processing.
              </p>
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
