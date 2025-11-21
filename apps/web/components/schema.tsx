"use client";

import { useEffect, useState } from "react";

interface SchemaProps {
  jsonLd: Record<string, any> | Record<string, any>[];
}

/**
 * Component to add JSON-LD schema to pages
 * Usage: <Schema jsonLd={generateWebsiteSchema()} />
 */
export function Schema({ jsonLd }: SchemaProps) {
  const [markup, setMarkup] = useState<string>("");

  useEffect(() => {
    // Only set the markup on the client side to avoid hydration issues
    setMarkup(
      Array.isArray(jsonLd)
        ? jsonLd.map((item) => JSON.stringify(item)).join("")
        : JSON.stringify(jsonLd),
    );
  }, [jsonLd]);

  if (!markup) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
