import { siteConfig } from "@/lib/config";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import fs from "fs";
import path from "path";
import rehypeMinifyWhitespace from "rehype-minify-whitespace";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter, type Highlighter } from "shiki";
import { unified } from "unified";

// Create a singleton highlighter instance
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

// Function to get the singleton highlighter
async function getSingletonHighlighter(options: any): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      ...options,
      langs: options.langs || [],
      themes: options.themes || [],
    }).then((highlighter) => {
      highlighterInstance = highlighter;
      return highlighter;
    });
  }

  return await highlighterPromise;
}

export type Post = {
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  authorTwitter?: string;
  slug: string;
  image?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<Post> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
    metadata[key.trim() as keyof Post] = value;
  });

  return { data: metadata as Post, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

export async function markdownToHTML(markdown: string) {
  const result = await unified()
    .use(remarkParse) // Parse markdown into mdast
    .use(remarkGfm) // Support GFM (tables, footnotes, etc.)
    .use(remarkRehype, { allowDangerousHtml: true }) // Transform to hast
    .use(rehypeRaw) // Allow raw HTML
    .use(rehypePrettyCode, {
      theme: "one-dark-pro",
      keepBackground: true,
      getHighlighter: getSingletonHighlighter,
      transformers: [
        transformerCopyButton({
          visibility: "always",
          feedbackDuration: 3_000,
        }),
      ],
    } satisfies Partial<Options>)
    .use(rehypeMinifyWhitespace)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

export async function getPost(slug: string) {
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.mdx`);
  const source = fs.readFileSync(filePath, "utf-8");
  const { content: rawContent, data: metadata } = parseFrontmatter(source);
  const content = await markdownToHTML(rawContent);
  const defaultImage = `${siteConfig.url}/og?title=${encodeURIComponent(
    metadata.title,
  )}`;
  return {
    source: content,
    metadata: {
      ...metadata,
      image: metadata.image || defaultImage,
    },
    slug,
  };
}

async function getAllPosts(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return await Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, path.extname(file));
      const { metadata, source } = await getPost(slug);
      return {
        ...metadata,
        slug,
        source,
      };
    }),
  );
}

export async function getBlogPosts() {
  return await getAllPosts(path.join(process.cwd(), "content/blog"));
}

// Clean up function to dispose of the highlighter when it's no longer needed
// This can be called when the app is shutting down or when the highlighter is no longer needed
export function disposeHighlighter() {
  if (highlighterInstance) {
    highlighterInstance.dispose();
    highlighterInstance = null;
    highlighterPromise = null;
  }
}
