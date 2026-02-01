"use client";

import { z } from "zod";
import { Code, Clock, HardDrive, Lightbulb, Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * Schema for CodeExplanation props
 * Used by Tambo to validate and generate props
 */
export const codeExplanationSchema = z.object({
  title: z.string().describe("Title of the algorithm or concept"),
  code: z.string().describe("The algorithm code or pseudocode to display"),
  language: z
    .string()
    .optional()
    .describe(
      "Programming language for syntax context (e.g., 'python', 'javascript')",
    ),
  explanation: z
    .string()
    .describe("Step-by-step explanation of how the algorithm works"),
  timeComplexity: z
    .string()
    .optional()
    .describe("Time complexity (e.g., 'O(n log n)')"),
  spaceComplexity: z
    .string()
    .optional()
    .describe("Space complexity (e.g., 'O(n)')"),
  keyInsights: z
    .array(z.string())
    .optional()
    .describe("Key insights or tips about the algorithm"),
});

export type CodeExplanationProps = z.infer<typeof codeExplanationSchema>;

/**
 * CodeExplanation Component
 *
 * Displays algorithm code with explanations and complexity analysis.
 * Used for teaching and explaining algorithms in a structured format.
 */
export function CodeExplanation({
  title,
  code,
  language,
  explanation,
  timeComplexity,
  spaceComplexity,
  keyInsights,
}: CodeExplanationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {language && (
          <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] capitalize">
            {language}
          </span>
        )}
      </div>

      {/* Code block - LeetCode style */}
      <div className="relative group">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleCopy}
            className="p-2 rounded-md bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground))]/20 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[hsl(var(--primary))]" />
            ) : (
              <Copy className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            )}
          </button>
        </div>
        <div className="p-4 bg-[#1a1a2e] overflow-x-auto">
          <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Complexity badges */}
      {(timeComplexity || spaceComplexity) && (
        <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
          {timeComplexity && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Time:
              </span>
              <span className="text-sm font-mono font-semibold text-[hsl(var(--primary))]">
                {timeComplexity}
              </span>
            </div>
          )}
          {spaceComplexity && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
              <HardDrive className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Space:
              </span>
              <span className="text-sm font-mono font-semibold text-[hsl(var(--accent))]">
                {spaceComplexity}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[hsl(var(--primary))]" />
            Explanation
          </h4>
          <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]/90 whitespace-pre-wrap">
            {explanation}
          </p>
        </div>

        {/* Key insights */}
        {keyInsights && keyInsights.length > 0 && (
          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))]" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {keyInsights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary))]">
                    {index + 1}
                  </span>
                  <span className="text-[hsl(var(--foreground))]/90">
                    {insight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
