import BlogCard from "@/components/blog-card";
import { Section } from "@/components/section";
import { getBlogPosts } from "@/lib/blog";

export async function Blog() {
  const allPosts = await getBlogPosts();

  const articles = await Promise.all(
    allPosts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  );

  return (
    <Section id="blog" title="Blog">
      <div className="grid grid-cols-1 lg:grid-cols-3 border border-b-0">
        {articles.map((data, idx) => (
          <BlogCard key={data.slug} data={data} priority={idx <= 1} />
        ))}
      </div>
    </Section>
  );
}
