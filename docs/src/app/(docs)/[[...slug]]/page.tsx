import { LLMCopyButton, OpenDropdown } from "@/components/ai-actions";
import { createDocPageSchema, PageJsonLd } from "@/components/json-ld";
import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { statSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";

const docLastModifiedCache = new Map<string, string | undefined>();

const getDocPageLastModified = (contentPath: string): string | undefined => {
  if (docLastModifiedCache.has(contentPath)) {
    return docLastModifiedCache.get(contentPath);
  }

  try {
    const filePath = join(process.cwd(), "content", "docs", contentPath);
    const lastModified = statSync(filePath).mtime.toISOString();
    docLastModifiedCache.set(contentPath, lastModified);
    return lastModified;
  } catch {
    docLastModifiedCache.set(contentPath, undefined);
    return;
  }
};

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const llmContent = await getLLMText(page);

  // Generate TechArticle schema for each doc page
  const pageSchema = createDocPageSchema({
    title: page.data.title,
    description: page.data.description ?? "",
    url: `${siteUrl}${page.url}`,
    dateModified: getDocPageLastModified(page.path),
  });

  return (
    <>
      <PageJsonLd schema={pageSchema} />
      <DocsPage toc={page.data.toc} full={page.data.full}>
        <Suspense fallback={<div>Loading...</div>}>
          <MessageThreadCollapsible className="tambo-theme" />
        </Suspense>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>

        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-fd-border">
          <LLMCopyButton content={llmContent} />
          <OpenDropdown
            markdownUrl={`${process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co"}${page.url}`}
            githubUrl={`https://github.com/tambo-ai/tambo/blob/main/docs/content/docs/${page.path}`}
          />
        </div>

        <DocsBody>
          <MDXContent
            components={getMDXComponents({
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
      </DocsPage>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const pageUrl = `${siteUrl}${page.url}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: pageUrl,
      siteName: "Tambo AI Docs",
      type: "article",
      locale: "en_US",
      images: [
        {
          url: "/logo/lockup/Tambo-Lockup.png",
          width: 1200,
          height: 630,
          alt: `${page.data.title} - Tambo AI Documentation`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
      site: "@tamborino",
      images: ["/logo/lockup/Tambo-Lockup.png"],
    },
  };
}
