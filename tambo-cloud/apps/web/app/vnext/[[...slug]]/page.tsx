import { cn } from "@/lib/utils";
import { vnextSource } from "@/lib/vnext-source";
import { Callout } from "fumadocs-ui/components/callout";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import Link from "next/link";
import { notFound } from "next/navigation";

// Custom MDX components with heading font
const customMdxComponents = {
  ...defaultMdxComponents,
  // Use a single function to handle all heading levels
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...props} className={cn("font-heading", className)} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className={cn("font-heading", className)} />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={cn("font-heading", className)} />
  ),
};

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = vnextSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <Callout type="info" title="V 1.0.0 Coming Soon">
        These are draft docs for the upcoming 0.1.0 release. Read more about the
        upcoming release{" "}
        <Link href="/blog/0-1-0-announcement" className="underline bold">
          here
        </Link>
        . Have a question about anything in the docs? Send us a{" "}
        <a href="mailto:magan@tambo.co" className="underline bold">
          message
        </a>
        .
      </Callout>
      <div className="font-heading">
        <DocsTitle>{page.data.title}</DocsTitle>
      </div>
      {page.data.description && (
        <DocsDescription className="docs-description-wrapper">
          {page.data.description}
        </DocsDescription>
      )}
      <DocsBody>
        <MDX components={customMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return vnextSource.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = vnextSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.title,
      description: page.data.description,
    },
  };
}
