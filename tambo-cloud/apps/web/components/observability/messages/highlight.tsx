import { memo } from "react";

interface HighlightTextProps {
  text: string;
  searchQuery: string;
}

export const HighlightText = memo(
  ({ text, searchQuery }: HighlightTextProps) => {
    if (!searchQuery || !text) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const queryLength = searchQuery.length;

    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(<span key={lastIndex}>{text.slice(lastIndex, index)}</span>);
      }

      // Add highlighted match
      parts.push(
        <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded">
          {text.slice(index, index + queryLength)}
        </mark>,
      );

      lastIndex = index + queryLength;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }

    return <>{parts}</>;
  },
);

HighlightText.displayName = "HighlightText";

// --------------------------------HighlightedJson component--------------------------------

interface HighlightedJsonProps {
  json: string;
  searchQuery?: string;
}

export const HighlightedJson = memo(
  ({ json, searchQuery }: HighlightedJsonProps) => {
    if (!searchQuery || !json) return <>{json}</>;

    const lowerJson = json.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const queryLength = searchQuery.length;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let index = lowerJson.indexOf(lowerQuery);

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(json.slice(lastIndex, index));
      }

      // Add highlighted match
      parts.push(
        <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded">
          {json.slice(index, index + queryLength)}
        </mark>,
      );

      lastIndex = index + queryLength;
      index = lowerJson.indexOf(lowerQuery, lastIndex);
    }

    // Add remaining text
    if (lastIndex < json.length) {
      parts.push(json.slice(lastIndex));
    }

    return <>{parts}</>;
  },
);

HighlightedJson.displayName = "HighlightedJson";
