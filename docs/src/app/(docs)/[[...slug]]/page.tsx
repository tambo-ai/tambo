import { LLMCopyButton, OpenDropdown } from "@/components/ai-actions";
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
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const llmContent = await getLLMText(page);

  return (
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

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
