"use client";

import { Section } from "@/components/section";
import { clsx } from "clsx";

import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/stackoverflow-light.css";
import {
  Code,
  FileCode,
  FileJson,
  MonitorIcon,
  PackageIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { InteractiveDemo } from "./interactive-demo";

hljs.registerLanguage("typescript", typescript);

type TabKey = "demo" | "provider" | "props" | "component" | "register";

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
    filename: "TamboConfig.ts",
    icon: <PackageIcon className="w-4 h-4" />,
    description: "Configuration to register custom components",
  },
};

// Highlighted lines for each code example
const highlightedLines: Record<Exclude<TabKey, "demo">, number[]> = {
  provider: [6, 8, 12, 13, 14],
  props: [],
  component: [2, 7, 8, 9],
  register: [9, 10],
};

// Code examples for different tabs
const codeExamples: Record<Exclude<TabKey, "demo">, string> = {
  provider: `// First we wrap our app in a TamboProvider
// Second we import the MessageThread
// The MessageThreadFull is the main component that will render the chat interface
// Add the component using the tambo cli \`npx tambo add message-thread-full\`

import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "@components/ui/message-thread";
import { tamboComponents } from "./TamboConfig";

export default function Chat() {
  return (
    <TamboProvider
      components={tamboComponents}
    >
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

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState<TabKey>("demo");
  const sectionRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const wheelCountRef = useRef(0);

  // Handle wheel events to count scrolls and disable snap after threshold
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWheel = (e: WheelEvent) => {
      // Only count wheel events when we're snapped and visible
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Check if component is centered in viewport (within 100px)
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const isCentered = Math.abs(elementCenter - viewportCenter) < 100;

      if (snapEnabled && isCentered) {
        // Immediately disable snap on any significant scroll attempt
        const scrollMagnitude = Math.abs(e.deltaY);
        if (scrollMagnitude > 20) {
          setSnapEnabled(false);
        } else {
          wheelCountRef.current += 1;

          // Reduced from 3 to 2 wheel events to disable snapping
          if (wheelCountRef.current >= 2) {
            setSnapEnabled(false);
          }
        }
      }
    };

    // Reset wheel count and re-enable snap when scrolling away
    const handleScroll = () => {
      if (!snapEnabled) {
        const rect = sectionRef.current?.getBoundingClientRect();
        if (!rect) return;

        // If component is far from center, re-enable snapping for next time
        const viewportCenter = window.innerHeight / 2;
        const elementCenter = rect.top + rect.height / 2;
        const isCentered = Math.abs(elementCenter - viewportCenter) < 200;

        if (!isCentered) {
          wheelCountRef.current = 0;
          setSnapEnabled(true);
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [snapEnabled]);

  // Set a flag when switching tabs to preserve demo state
  const handleTabChange = (tab: TabKey) => {
    // Always keep demo mounted in the DOM to preserve state
    setActiveTab(tab);
  };

  // Apply scroll snap styles to the main container using CSS variables
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Apply scroll-snap properties to html/body
    if (snapEnabled) {
      // Use proximity instead of mandatory for gentler snapping
      document.documentElement.style.scrollSnapType = "y proximity";
      document.body.style.scrollBehavior = "smooth";

      // Auto-disable snap after 1.5 seconds
      const timeout = setTimeout(() => {
        setSnapEnabled(false);
      }, 1500);

      return () => clearTimeout(timeout);
    } else {
      document.documentElement.style.scrollSnapType = "";
      document.body.style.scrollBehavior = "";
    }

    return () => {
      // Cleanup
      document.documentElement.style.scrollSnapType = "";
      document.body.style.scrollBehavior = "";
    };
  }, [snapEnabled]);

  return (
    <Section
      id="code-examples"
      className="py-4 sm:py-6 md:py-8 lg:py-10 scroll-mt-16"
    >
      <div
        ref={sectionRef}
        style={{
          scrollSnapAlign: snapEnabled ? "center" : "none",
        }}
        className="w-full space-y-4"
      >
        <div className="w-full max-w-[80vw] md:max-w-[76vw] h-[76vh] md:h-[72vh] mx-auto">
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
              <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden">
                {Object.entries(fileInfo).map(([key, { filename, icon }]) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key as TabKey)}
                    className={clsx(
                      "px-4 py-1.5 text-[15px] font-medium transition-colors border-x border-t rounded-t-lg -mb-px flex items-center space-x-1.5",
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

            {/* Content area - adjust height calculation */}
            <div className="relative h-[calc(100%-2.75rem)] pb-2">
              {/* Always keep demo in DOM but hide it when not active */}
              <div
                ref={demoRef}
                className={`h-full overflow-hidden p-4 ${activeTab === "demo" ? "block" : "hidden"}`}
              >
                <InteractiveDemo />
              </div>

              {activeTab !== "demo" && (
                <pre
                  className="hljs language-typescript"
                  style={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.9rem",
                    boxShadow: "none",
                    height: "100%",
                    overflow: "auto",
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
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
