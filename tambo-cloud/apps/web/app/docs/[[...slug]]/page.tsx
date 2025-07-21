import { source } from "@/lib/source";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
// Todo: Add back image support...
// Todo: Search https://fumadocs.vercel.app/docs/headless/search
// Routing: https://fumadocs.vercel.app/docs/headless/search
// import { metadataImage } from "@/lib/metadata";

// Custom MDX components with heading font
const customMdxComponents = {
  ...defaultMdxComponents,
};

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <div className="flex flex-col gap-2 p-4 md:p-10">
        <div className="flex flex-col">
          <div className="fd-prose">
            <DocsTitle>{page.data.title}</DocsTitle>
          </div>
          {page.data.description && (
            <DocsDescription>{page.data.description}</DocsDescription>
          )}
        </div>
        <DocsBody className="max-w-[1000px] fd-prose">
          <MDX components={customMdxComponents} />
        </DocsBody>
      </div>
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
