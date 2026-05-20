import { source } from "@/lib/source";
import Link from "next/link";

export default function NotFound() {
  const pages = source.getPages();

  // Group pages by top-level section for readability
  const sections = new Map<string, Array<{ url: string; title: string }>>();
  for (const page of pages) {
    const section = page.slugs[0] ?? "docs";
    const list = sections.get(section) ?? [];
    list.push({ url: page.url, title: page.data.title });
    sections.set(section, list);
  }

  return (
    <main className="flex flex-col items-center py-16 px-4">
      <h1 className="text-3xl font-heading font-bold mb-2">Page not found</h1>
      <p className="text-fd-muted-foreground mb-8 text-center max-w-lg">
        This URL doesn&apos;t match any documentation page. Browse the sidebar
        or pick from the full list below.
      </p>

      <div className="text-sm text-fd-muted-foreground mb-8 text-center">
        AI agents: use{" "}
        <Link href="/llms.txt" className="text-fd-primary underline">
          /llms.txt
        </Link>{" "}
        for a structured index, or{" "}
        <Link href="/llms-full.txt" className="text-fd-primary underline">
          /llms-full.txt
        </Link>{" "}
        for complete docs. Append <code>.mdx</code> to any path for raw
        Markdown.
      </div>

      <div className="w-full max-w-2xl">
        {[...sections.entries()].map(([section, sectionPages]) => (
          <div key={section} className="mb-6">
            <h2 className="text-sm font-semibold text-fd-muted-foreground uppercase tracking-wider mb-2">
              {section}
            </h2>
            <ul className="space-y-1">
              {sectionPages.map((page) => (
                <li key={page.url}>
                  <Link
                    href={page.url}
                    className="text-fd-primary hover:underline"
                  >
                    {page.title}
                  </Link>
                  <span className="text-fd-muted-foreground text-sm ml-2">
                    {page.url}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
