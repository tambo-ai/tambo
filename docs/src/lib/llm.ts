import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import { remarkInclude } from "fumadocs-mdx/config";
import { source } from "@/lib/source";
import type { InferPageType } from "fumadocs-core/source";

const processor = remark().use(remarkMdx).use(remarkInclude).use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof source>) {
  try {
    const processed = await processor.process({
      path: page.url || "unknown",
      value: page.data.content,
    });

    return `# ${page.data.title}
    URL: ${page.url}
    ${processed.value}`;
  } catch (error) {
    console.error("Error processing markdown:", error);
    return `# ${page.data.title}
    URL: ${page.url}
    ${page.data.content}`;
  }
}
