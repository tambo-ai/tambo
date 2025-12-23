import { source } from "@/lib/source";

export const revalidate = 3600;

type DocsPage = ReturnType<(typeof source)["getPages"]>[number];

// Maximum total description length, including ellipsis when truncated.
const MAX_DESCRIPTION_LENGTH = 240;

function normalizeDescription(description: string) {
  return description.trim().replace(/\s+/g, " ");
}

function truncateDescription(
  description: string,
  max = MAX_DESCRIPTION_LENGTH,
) {
  const normalized = normalizeDescription(description);
  return normalized.length > max
    ? `${normalized.slice(0, max - 1)}…`
    : normalized;
}

function getPageDescription(page: DocsPage) {
  // Both author-provided and fallback descriptions are normalized and truncated.
  if (page.data.description != null && page.data.description.trim() !== "") {
    return truncateDescription(page.data.description);
  }

  return truncateDescription(`Documentation for ${page.data.title}.`);
}

function getPageSection(page: DocsPage) {
  // Pages without a top-level slug (e.g. "/") are grouped under "tambo-docs".
  return page.slugs[0] ?? "tambo-docs";
}

export async function GET() {
  const scanned: string[] = [];
  scanned.push("# Tambo");
  scanned.push(
    "> Tambo is a Generative UI Agent for React that lets AI dynamically render registered components. Tambo's UI Agent handles component registration, message threads, streaming, and tool integration.",
  );
  scanned.push(
    "Use `/llms-full.txt` for a single file containing all docs. Append `.mdx` to any docs path to fetch that page as Markdown (e.g. `/getting-started/quickstart.mdx`).",
  );

  const map = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const section = getPageSection(page);
    const list = map.get(section) ?? [];
    list.push(
      `- [${page.data.title}](${page.url}): ${getPageDescription(page)}`,
    );
    map.set(section, list);
  }

  // Section order follows the order sections are first encountered in source.getPages().
  for (const [key, value] of map) {
    scanned.push(`## ${key}`);
    scanned.push(value.join("\n"));
  }

  return new Response(scanned.join("\n\n"));
}
