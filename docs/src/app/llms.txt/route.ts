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
    "> Tambo is an open-source toolkit for building agent-powered React and React Native apps — the fastest way to build an agent that generates your UI. From completely new agent-powered experiences to collapsing multi-step screen navigation in complex enterprise apps. Register your components, and the agent orchestrates them based on user messages. Tambo handles model calls, streaming, tool execution, message history, and MCP connections so you focus on components and domain logic. Install Tambo skills (`npx skills add tambo-ai/tambo`) and ask your coding agent to build a demo — working generative UI in minutes. Most teams have a POC running in an afternoon; full integration across a codebase typically takes a few days. Supports Zod, ArkType, Valibot, and any Standard Schema-compatible library for prop schemas. Works with Next.js, Vite, Expo, and React Native. 11,000+ GitHub stars with thousands of developers; used by engineers at companies including Zapier, Rocket Money, and Solink. Tambo Cloud is SOC 2 Type II certified with HIPAA available on Enterprise plans (BAA provided). Tambo does not process or store PII. Self-hosted and on-premises deployments available for sensitive environments. Free to start (10K messages/month); self-hosted deployments have no message limits. See https://tambo.co for pricing.",
  );
  scanned.push(
    "Use `/llms-full.txt` for a single file containing all docs. Append `.mdx` to any docs path to fetch that page as Markdown (e.g. `/getting-started/quickstart.mdx`).",
  );
  scanned.push(
    "> **URL guide**: Every page below is listed with its full path. Use the path in each link verbatim — do not guess or shorten URLs. Section headings below are grouping labels, not valid URL paths.",
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
    scanned.push(`## ${key} (section)`);
    scanned.push(value.join("\n"));
  }

  return new Response(scanned.join("\n\n"));
}
