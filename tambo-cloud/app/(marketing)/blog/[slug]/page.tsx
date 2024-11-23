import Author from "@/components/blog-author";
import { CTA } from "@/components/sections/cta";
import { getPost } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const params = await props.params;
  let post = await getPost(params.slug);
  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${siteConfig.url}/blog/${post.slug}`,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) {
    notFound();
  }
  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${siteConfig.url}${post.metadata.image}`
              : `${siteConfig.url}/blog/${post.slug}/opengraph-image`,
            url: `${siteConfig.url}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: siteConfig.name,
            },
          }),
        }}
      />
      <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6 lg:px-8 space-y-4 my-12">
        <Suspense
          fallback={
            <div className="mb-8 w-full h-64 bg-muted animate-pulse rounded-lg"></div>
          }
        >
          {post.metadata.image && (
            <div className="mb-8">
              <Image
                width={1920}
                height={1080}
                src={post.metadata.image}
                alt={post.metadata.title}
                className="w-full h-auto rounded-lg border"
              />
            </div>
          )}
        </Suspense>
        <div className="flex flex-col">
          <h1 className="title font-medium text-3xl tracking-tighter">
            {post.metadata.title}
          </h1>
        </div>
        <div className="flex justify-between items-center text-sm">
          <Suspense fallback={<p className="h-5" />}>
            <div className="flex items-center space-x-2">
              <time dateTime={post.metadata.publishedAt} className="text-sm">
                {formatDate(post.metadata.publishedAt)}
              </time>
            </div>
          </Suspense>
        </div>
        <div className="flex items-center space-x-2">
          <Author
            twitterUsername={post.metadata.author}
            name={post.metadata.author}
            image={"/author.jpg"}
          />
        </div>
        <article
          className="prose dark:prose-invert mx-auto max-w-full"
          dangerouslySetInnerHTML={{ __html: post.source }}
        ></article>
      </div>
      <CTA />
    </section>
  );
}
