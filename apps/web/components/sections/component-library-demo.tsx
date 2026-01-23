"use client";

import { Section } from "@/components/section";
import { demoComponents } from "@/components/ui/tambo/demo-config";
import { TamboEmailButton } from "@/components/ui/tambo/tambo-email-button";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { clsx } from "clsx";
import { Easing, motion } from "framer-motion";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/stackoverflow-light.css";
import {
  Code,
  FileCode,
  FileJson,
  FileText,
  MonitorIcon,
  PackageIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";

hljs.registerLanguage("typescript", typescript);

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

type TabKey =
  | "demo"
  | "provider"
  | "props"
  | "component"
  | "register"
  | "getting-started";

// File information for each code example
const fileInfo: Record<
  TabKey,
  { filename: string; icon: React.ReactNode; description: string }
> = {
  demo: {
    filename: "localhost:3000",
    icon: <MonitorIcon className="w-4 h-4" />,
    description: "Live demo component showing the Tambo chat interface",
  },
  provider: {
    filename: "App.tsx",
    icon: <Code className="w-4 h-4" />,
    description: "Root component with TamboProvider setup",
  },
  props: {
    filename: "EmailProps.ts",
    icon: <FileJson className="w-4 h-4" />,
    description: "Zod schema for type-safe prop validation",
  },
  component: {
    filename: "EmailForm.tsx",
    icon: <FileCode className="w-4 h-4" />,
    description: "Custom component with Tambo state hooks",
  },
  register: {
    filename: "tambo.ts",
    icon: <PackageIcon className="w-4 h-4" />,
    description: "Configuration to register custom components",
  },
  "getting-started": {
    filename: "GETTING_STARTED.md",
    icon: <FileText className="w-4 h-4" />,
    description: "Quick start guide for building with Tambo",
  },
};

// Highlighted lines for each code example
const highlightedLines: Record<Exclude<TabKey, "demo">, number[]> = {
  provider: [6, 8, 12, 13, 14],
  props: [],
  component: [2, 7, 8, 9],
  register: [9, 10],
  "getting-started": [1, 5, 9, 13],
};

// Code examples for different tabs
const codeExamples: Record<Exclude<TabKey, "demo">, string> = {
  provider: `// First we wrap our app in a TamboProvider

import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "@components/ui/message-thread";
import { tamboComponents } from "./tambo";

export default function Chat() {
  return (
    <TamboProvider
      components={tamboComponents}
    >
        // Second we import the MessageThreadFull component
        // from our component library.
        // you can also roll your own components!
      <MessageThreadFull />
    </TamboProvider>
  );
}`,

  props: `// Now we define the props for the component
// We use zod to validate the props

import { z } from "zod/v3";

export const EmailProps = z.object({
  subject: z.string().optional(),
  message: z.string(),
});

// We can now export the props for our component
export type EmailProps = z.infer<typeof EmailProps>;
`,

  component: `// Create a component like normal but with tambo-ai for state management
import { useTamboState } from "@tambo-ai/react";
import { EmailProps } from "./EmailProps"; // from file before

export function EmailForm(EmailProps: EmailProps) {
  // Use Tambo state hooks to pass the values to the AI
  const [emailSubject, setEmailSubject] = useTamboState("emailSubject", subject);
  const [emailMessage, setEmailMessage] = useTamboState("emailMessage", message);
  const [status, setStatus] = useTamboState("emailStatus", "pending");

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={emailSubject}
        onChange={(e) => setEmailSubject(e.target.value)}
        placeholder="Subject"
      />
      <textarea
        value={emailMessage}
        onChange={(e) => setEmailMessage(e.target.value)}
        placeholder="Your message"
      />
      <button type="submit">
        {status === "sent" ? "Sent!" : "Send Email"}
      </button>
    </form>
  );
}`,

  register: ` // Now let's add the component to our registry!
import { EmailForm } from "./EmailForm";
import { EmailProps } from "./EmailProps";

export const tamboComponents = [
  {
    name: "EmailForm",
    description: "A form to email the team",
    component: EmailForm, // your email component
    propsSchema: EmailProps, // the zod schema for the props,
  },
];`,

  "getting-started": "", // Will be rendered as JSX instead
};

// GettingStartedContent component for rendered markdown
const GettingStartedContent: React.FC = () => {
  return (
    <div className="p-6 max-w-none bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Getting Started with Tambo
      </h1>

      <div className="space-y-8">
        {/* Installation */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Installation
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
            <code className="text-gray-800">npm install @tambo-ai/react</code>
          </div>
        </div>

        {/* Template App */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Template App
          </h2>
          <p className="text-gray-700 mb-3">
            Get started quickly with our pre-built template:
          </p>
          <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
            <code className="text-gray-800">npm create tambo-app</code>
          </div>
        </div>

        {/* Resources */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Resources
          </h2>
          <ul className="space-y-2">
            <li>
              <a
                href="https://docs.tambo.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="https://ui.tambo.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                UI Library
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// HighlightedCodeBlock component for code rendering with highlight.js
interface HighlightedCodeBlockProps {
  code: string;
  highlightedLines?: number[];
}

export const HighlightedCodeBlock: React.FC<HighlightedCodeBlockProps> = ({
  code,
  highlightedLines = [],
}) => {
  const highlighted = hljs.highlight(code, { language: "typescript" }).value;
  const lines = highlighted.split(/\n/);
  return (
    <>
      {lines.map((line: string, idx: number) => {
        const lineNumber = idx + 1;
        const isHighlighted = highlightedLines.includes(lineNumber);
        return (
          <div
            key={lineNumber}
            style={{
              display: "block",
              backgroundColor: isHighlighted
                ? "rgba(0, 150, 255, 0.15)"
                : undefined,
              borderLeft: isHighlighted
                ? "3px solid rgb(0, 120, 255)"
                : "3px solid transparent",
              paddingLeft: 4,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 28,
                color: "#b0b0b0",
                userSelect: "none",
                textAlign: "right",
                marginRight: 8,
                fontSize: "0.85em",
              }}
            >
              {lineNumber}
            </span>
            <span dangerouslySetInnerHTML={{ __html: line || "\u200B" }} />
          </div>
        );
      })}
    </>
  );
};

export function ComponentLibraryDemo() {
  const [activeTab, setActiveTab] = useState<TabKey>("demo");
  const [isFormInteractionActive, setIsFormInteractionActive] = useState(false);

  useEffect(() => {
    const isContextKeySet = localStorage.getItem("tambo-context-key");
    if (!isContextKeySet) {
      const contextKey = new Date().toISOString();
      localStorage.setItem("tambo-context-key", contextKey);
    }
  }, []);

  // Handle input focus to hide/show the email button
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      // Hide button when ANY input or textarea is focused
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        setIsFormInteractionActive(true);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Show button when clicking outside of inputs/textareas/forms
      // But don't interfere with button functionality
      if (
        !target.closest("input") &&
        !target.closest("textarea") &&
        !target.closest('[contenteditable="true"]') &&
        !target.closest("form") &&
        !target.closest("[data-tambo-email-button]")
      ) {
        setIsFormInteractionActive(false);
      }
    };

    // Add event listeners
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  return (
    <Section
      id="demo"
      className="py-16 sm:py-24 scroll-mt-[var(--header-height)]"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Interactive Demo - Full Width */}
        <motion.div
          className="w-full overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          <div className="w-full h-[86vh] md:h-[82vh] overflow-hidden">
            <div className="rounded-lg overflow-hidden border shadow-md bg-background h-full">
              {/* Code editor header with terminal-style tabs */}
              <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center">
                {/* Window Controls */}
                <div className="flex items-center space-x-2 mr-6">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>

                {/* Terminal-style Tabs */}
                <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden min-w-0">
                  {Object.entries(fileInfo).map(([key, { filename, icon }]) => (
                    <button
                      key={key}
                      onClick={() => handleTabChange(key as TabKey)}
                      className={clsx(
                        "px-4 py-1.5 text-[15px] font-medium transition-colors border-x border-t rounded-t-lg -mb-px flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0",
                        activeTab === key
                          ? "bg-white text-gray-900 border-gray-200"
                          : "text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200/50",
                      )}
                    >
                      {icon}
                      <span className="ml-1">{filename}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content area */}
              <div className="relative h-[calc(100%-2.75rem)] pb-2">
                {/* Demo tab content */}
                <div
                  className={`h-full overflow-hidden ${activeTab === "demo" ? "block" : "hidden"}`}
                >
                  <TamboProvider
                    apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
                    tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
                    components={demoComponents}
                  >
                    <div className="tambo-theme w-full h-full">
                      <div className="relative h-full">
                        <MessageThreadFull className="shadow-xl max-h-full rounded-lg" />
                        {!isFormInteractionActive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="pointer-events-auto">
                              <TamboEmailButton />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TamboProvider>
                </div>

                {/* Code tabs content */}
                {activeTab !== "demo" && activeTab !== "getting-started" && (
                  <pre
                    className="hljs language-typescript text-left"
                    style={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "0.9rem",
                      boxShadow: "none",
                      height: "100%",
                      overflow: "auto",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <code>
                      <HighlightedCodeBlock
                        code={codeExamples[activeTab]}
                        highlightedLines={highlightedLines[activeTab]}
                      />
                    </code>
                  </pre>
                )}

                {/* Getting Started tab content */}
                {activeTab === "getting-started" && (
                  <div
                    className="h-full overflow-auto bg-white"
                    style={{
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <GettingStartedContent />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
