"use client";

import clsx from "clsx";
import { Clipboard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TabType = "template" | "existing";

const Commands = {
  template: {
    cmd: "git clone https://github.com/tambo-ai/tambo-template.git && cd tambo-template && npm install && npx tambo init",
  },
  existing: {
    cmd: "npx tambo full-send",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors rounded-md p-1"
      aria-label="Copy to clipboard"
    >
      <Clipboard className="h-4 w-4" />
    </button>
  );
}

function CommandBlock({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <div className="group mb-4">
      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        {/* Terminal Header */}
        <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center space-x-6">
          {/* Window Controls */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>

          {/* Terminal Tabs */}
          <div className="flex-1 flex items-center">
            {[
              { id: "template", label: "Start with a Template" },
              { id: "existing", label: "Add to Existing App" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={clsx(
                  "px-6 py-1.5 text-[15px] font-medium transition-colors border-x border-t rounded-t-lg -mb-px",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 border-gray-200"
                    : "text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <CopyButton text={Commands[activeTab].cmd} />
        </div>

        {/* Terminal Content */}
        <div className="bg-white">
          <div className="flex items-center px-6 py-4">
            <span className="font-mono text-[15px] text-gray-400 select-none mr-4">
              $
            </span>
            <pre className="font-mono text-[15px] text-gray-800 overflow-x-auto flex-1">
              <code>{Commands[activeTab].cmd}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstallationSteps() {
  const [activeTab, setActiveTab] = useState<TabType>("template");

  return (
    <section className="py-24">
      <div className="space-y-4 mb-16">
        <h2 className="font-heading text-6xl">Get Started with Tambo</h2>
        <p className="text-xl text-[#1a2b3b]">
          Choose your preferred installation method and start building in
          minutes.
        </p>
      </div>

      <div className="w-full">
        <div className="space-y-8">
          <CommandBlock activeTab={activeTab} setActiveTab={setActiveTab} />
          <Link
            href={`/docs/getting-started/quickstart${activeTab === "template" ? "#template" : "#existing-app"}`}
            className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-black rounded-lg font-sans text-sm font-medium transition-colors"
          >
            View full installation guide →
          </Link>
        </div>
      </div>
    </section>
  );
}
