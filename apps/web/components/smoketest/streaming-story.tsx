"use client";

import { useEffect } from "react";

interface Props {
  text: string;
}

export function StreamingStory({ text }: Props) {
  // Load Caveat font from Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  // Split text into lines for the lined paper effect
  const lines = text ? text.split("\n") : ["(waiting for text...)"];

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative max-w-lg mb-4">
      {/* Paper with holes and lines */}
      <div className="relative bg-white shadow-md border border-gray-200">
        {/* Red margin line */}
        <div className="absolute top-0 bottom-0 left-[52px] w-px bg-red-400/70" />

        {/* Three-hole punch marks - white holes with shadow like cut through */}
        <div
          className="absolute left-5 top-12 w-3 h-3 rounded-full bg-white"
          style={{
            boxShadow:
              "inset 1px 1px 3px rgba(0,0,0,0.3), inset 0 0 1px rgba(0,0,0,0.2)",
          }}
        />
        <div
          className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
          style={{
            boxShadow:
              "inset 1px 1px 3px rgba(0,0,0,0.3), inset 0 0 1px rgba(0,0,0,0.2)",
          }}
        />
        <div
          className="absolute left-5 bottom-12 w-3 h-3 rounded-full bg-white"
          style={{
            boxShadow:
              "inset 1px 1px 3px rgba(0,0,0,0.3), inset 0 0 1px rgba(0,0,0,0.2)",
          }}
        />

        {/* Date header - blank area above the lines */}
        <div
          className="text-right text-gray-500 pr-4 pl-16 pt-3 pb-4 text-base"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          {dateStr}
        </div>

        {/* Lined area with text */}
        <div
          className="pl-16 pr-4"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                transparent,
                transparent 27px,
                #c5dff5 27px,
                #c5dff5 28px
              )
            `,
          }}
        >
          <div
            className="text-gray-800 whitespace-pre-wrap text-xl pt-[6px]"
            style={{
              fontFamily: "'Caveat', cursive",
              lineHeight: "28px",
            }}
          >
            {lines.map((line, i) => (
              <div key={i}>{line || "\u00A0"}</div>
            ))}
          </div>
        </div>

        {/* Footer - blank area below the lines */}
        <div className="pt-8 pb-6" />
      </div>
    </div>
  );
}
