import { source } from "@/lib/source";
import type { InferPageType } from "fumadocs-core/source";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

const processor = remark()
  .use(remarkMdx)
  .use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await processor.process({
    path: page.data._file.absolutePath,
    value: page.data.content,
  });

  // note: it doesn't escape frontmatter, it's up to you.
  return `# ${page.data.title}
URL: ${page.url}

${processed.value}`;
}
