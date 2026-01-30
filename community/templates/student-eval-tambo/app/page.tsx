"use client";

import { useState } from "react";
import { useTamboThread } from "@tambo-ai/react";

export default function HomePage() {
  const { thread, sendThreadMessage } = useTamboThread();
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      await sendThreadMessage(
        "Analyze student performance. Use the tools to fetch all students, identify low performers (below 60), and create a subject summary. Present the data in clear tables.",
        { streamResponse: true },
      );
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        🎓 Student Evaluation Dashboard
      </h1>

      <p className="text-gray-600 mb-6">
        AI-powered student performance analysis using Tambo tools and Prisma
        ORM.
      </p>

      <button
        onClick={analyze}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors mb-8"
      >
        {loading ? "Analyzing..." : "🔍 Analyze Student Performance"}
      </button>

      {/* Tambo Generative UI renders here */}
      <div className="border rounded-lg p-6 space-y-4 min-h-[300px]">
        {thread.messages.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            Click the button above to start AI analysis
          </p>
        ) : (
          thread.messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Render message content */}
              {Array.isArray(message.content) ? (
                message.content.map((part, i) => {
                  if (part.type === "text" && typeof part.text === "string") {
                    return (
                      <div key={i} className="prose prose-sm max-w-none">
                        {renderContent(part.text)}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <p className="text-gray-800">{String(message.content)}</p>
              )}

              {/* Render any generated components */}
              {message.renderedComponent && (
                <div className="my-4">{message.renderedComponent}</div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function renderContent(text: string) {
  // Simple JSON table detection
  const trimmed = text.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const data = JSON.parse(trimmed);
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === "object"
      ) {
        return <DataTable data={data} />;
      }
    } catch {
      // Not JSON, render as text
    }
  }
  return <p className="text-gray-800 whitespace-pre-wrap">{text}</p>;
}

function DataTable({ data }: { data: Record<string, unknown>[] }) {
  const columns = Object.keys(data[0] ?? {});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse border">
        <thead>
          <tr className="bg-gray-50 border-b">
            {columns.map((col) => (
              <th key={col} className="text-left font-semibold p-3 border">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="p-3 border">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
