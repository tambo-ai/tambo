"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const Terminal = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8 overflow-hidden rounded-lg bg-black/90 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="w-6 h-6 text-white"
        >
          <rect width="256" height="256" fill="none" />
          <line
            x1="208"
            y1="128"
            x2="128"
            y2="208"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <line
            x1="192"
            y1="40"
            x2="40"
            y2="192"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
      </div>
      <div className="p-4 font-mono text-sm">
        <div className="flex items-center">
          <span className="text-green-400">$</span>
          <pre className="ml-2 text-white">{command}</pre>
        </div>
      </div>
      <div className="absolute top-2 py-10 right-2 z-10">
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
  );
};

export default Terminal;
