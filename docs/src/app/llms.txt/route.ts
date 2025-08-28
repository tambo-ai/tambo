import { source } from "@/lib/source";

export const revalidate = 3600;

export async function GET() {
  const scanned: string[] = [];
  scanned.push("# Docs");
  const map = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const dir = page.slugs[0];
    const list = map.get(dir) ?? [];
    list.push(
      page.data.description != null
        ? `- [${page.data.title}](${page.url}): ${page.data.description}`
        : `- [${page.data.title}](${page.url})`,
    );
    // First dir returns undefined which we are considering as main docs route
    map.set(dir ?? "tambo-docs", list);
  }

  for (const [key, value] of map) {
    scanned.push(`## ${key}`);
    scanned.push(value.join("\n"));
  }

  return new Response(scanned.join("\n\n"));
}
