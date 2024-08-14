"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodeProps {
  code: string;
  language?: string;
  fileName?: string;
}

const Code: React.FC<CodeProps> = ({
  code,
  language = "javascript",
  fileName,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8 overflow-hidden rounded-lg bg-[#1E1E1E] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#323233]">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center space-x-2">
          {fileName && (
            <span className="text-sm text-gray-400">{fileName}</span>
          )}
          <span className="text-sm text-gray-400">{language}</span>
        </div>
      </div>
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          {code}
        </SyntaxHighlighter>
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="text-white hover:bg-gray-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Code;
