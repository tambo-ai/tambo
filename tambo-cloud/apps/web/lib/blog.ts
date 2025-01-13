import { siteConfig } from "@/lib/config";
import fs from "fs";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import { type Options } from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeMinifyWhitespace from "rehype-minify-whitespace";
import { unified } from "unified";
import { transformerCopyButton } from "@rehype-pretty/transformers";

export type Post = {
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  slug: string;
  image?: string;
};

function parseFrontmatter(fileContent: string) {
  let frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  let match = frontmatterRegex.exec(fileContent);
  let frontMatterBlock = match![1];
  let content = fileContent.replace(frontmatterRegex, "").trim();
  let frontMatterLines = frontMatterBlock.trim().split("\n");
  let metadata: Partial<Post> = {};

  frontMatterLines.forEach((line) => {
    let [key, ...valueArr] = line.split(": ");
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
      transformers: [
        transformerCopyButton({
          visibility: "always",
          feedbackDuration: 3_000,
        } as any),
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
    metadata.title
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
  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, path.extname(file));
      const { metadata, source } = await getPost(slug);
      return {
        ...metadata,
        slug,
        source,
      };
    })
  );
}

export async function getBlogPosts() {
  return getAllPosts(path.join(process.cwd(), "content/blog"));
}
