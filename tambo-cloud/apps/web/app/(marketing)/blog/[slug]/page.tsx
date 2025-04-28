import Author from "@/components/blog-author";
import { BlogCTA } from "@/components/blog-cta";
import { Schema } from "@/components/schema";
import { Button } from "@/components/ui/button";
import { getPost } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import { generateBlogPostSchema } from "@/lib/schema";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const params = await props.params;
  const post = await getPost(params.slug);
  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;

  const path = `/blog/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${siteConfig.url}${path}`,
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
    alternates: {
      canonical: `${siteConfig.url}${path}`,
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const post = await getPost(params.slug);

  // Generate blog post schema
  const blogPostSchema = generateBlogPostSchema({
    title: post.metadata.title,
    description: post.metadata.summary,
    publishedAt: post.metadata.publishedAt,
    authorName: post.metadata.author || siteConfig.name,
    authorUrl: post.metadata.authorTwitter
      ? `https://twitter.com/${post.metadata.authorTwitter}`
      : undefined,
    slug: post.slug,
    image: post.metadata.image
      ? `${siteConfig.url}${post.metadata.image}`
      : `${siteConfig.url}/blog/${post.slug}/opengraph-image`,
  });

  return (
    <section id="blog" className="relative">
      {/* Decorative accent elements */}
      <div className="absolute top-20 right-5 md:right-20 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-40 left-5 md:left-20 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />

      <Schema jsonLd={blogPostSchema} />

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-16 my-8 md:my-10 relative">
        <div className="flex justify-start mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/blog" className="text-accent hover:text-accent">
              ← Back to Articles
            </Link>
          </Button>
        </div>

        <div className="max-w-3xl mx-auto">
          {post.metadata.image && (
            <div className="mb-6 relative">
              <div className="absolute -top-2 -left-2 w-16 h-16 bg-accent/20 rounded-full blur-xl -z-10" />
              <Image
                width={1200}
                height={630}
                src={post.metadata.image}
                alt={post.metadata.title}
                className="w-full h-auto rounded-lg border"
                priority
              />
            </div>
          )}

          <div className="mb-5">
            <h1 className="font-heading font-medium text-3xl md:text-4xl text-foreground mb-3 relative inline-block">
              {post.metadata.title}
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-accent/30 rounded-full" />
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
              <time dateTime={post.metadata.publishedAt}>
                {formatDate(post.metadata.publishedAt)}
              </time>

              <Author
                name={post.metadata.author}
                image={"/michael-magan-li.jpeg"}
                twitterUsername={post.metadata.authorTwitter}
              />
            </div>
          </div>

          <article
            className="prose prose-lg mx-auto max-w-full prose-headings:font-heading prose-headings:font-medium prose-a:text-accent hover:prose-a:text-accent/80 prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.source }}
          ></article>
        </div>
      </div>

      <BlogCTA />
    </section>
  );
}
