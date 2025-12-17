import { source } from "@/lib/source";

export const revalidate = 3600;

type DocsPage = ReturnType<(typeof source)["getPages"]>[number];

function normalizeDescription(description: string) {
  return description.trim().replace(/\s+/g, " ");
}

function getPageDescription(page: DocsPage) {
  if (page.data.description != null && page.data.description.trim() !== "") {
    return normalizeDescription(page.data.description);
  }

  return `Documentation for ${page.data.title}.`;
}

function getPageSection(page: DocsPage) {
  // Pages without a top-level slug (e.g. "/") are grouped under "overview".
  return page.slugs[0] ?? "overview";
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

  const pinnedSectionOrder = ["getting-started", "api-reference", "concepts"];
  const remainingSections = [...map.keys()]
    .filter((key) => !pinnedSectionOrder.includes(key))
    .toSorted();

  for (const key of [...pinnedSectionOrder, ...remainingSections]) {
    const value = map.get(key);
    if (!value) {
      continue;
    }

    scanned.push(`## ${key}`);
    scanned.push(value.join("\n"));
  }

  return new Response(scanned.join("\n\n"));
}
