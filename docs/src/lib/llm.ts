import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import { remarkInclude } from "fumadocs-mdx/config";
import { source } from "@/lib/source";
import type { InferPageType } from "fumadocs-core/source";

const processor = remark().use(remarkMdx).use(remarkInclude).use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof source>) {
  try {
    // Log page data for debugging
    console.log("Processing page:", {
      url: page.url,
      title: page.data.title,
      hasContent: !!page.data.content,
      contentLength: page.data.content?.length || 0,
    });

    if (!page.data.content) {
      throw new Error(`No content found for page: ${page.url}`);
    }

    const processed = await processor.process({
      path: page.url || "unknown",
      value: page.data.content,
    });

    return `# ${page.data.title}
URL: ${page.url}

${processed.value}`;
  } catch (error) {
    console.error("Error processing markdown for page:", page.url, error);
    console.error("Page data:", {
      title: page.data.title,
      url: page.url,
      hasContent: !!page.data.content,
      contentPreview: page.data.content?.substring(0, 100) || "No content",
    });

    // Return fallback content
    return `# ${page.data.title}
URL: ${page.url}

${page.data.content || "Content not available"}`;
  }
}
