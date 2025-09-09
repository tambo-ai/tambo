import { source } from "@/lib/source";
import type { InferPageType } from "fumadocs-core/source";

export async function getLLMText(page: InferPageType<typeof source>) {
  const mdxSource = page.data.content;

  return `# ${page.data.title}
URL: ${page.url}

${mdxSource}`;
}
