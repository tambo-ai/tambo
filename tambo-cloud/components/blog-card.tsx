import { Post } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function BlogCard({
  data,
  priority,
}: {
  data: Post;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/blog/${data.slug}`}
      className="bg-background transition-colors hover:bg-secondary/20 p-4 last:border-b-0 lg:border-r last:lg:border-r-0 border-b lg:border-b-0"
    >
      {data.image && (
        <Image
          className="object-cover border"
          src={data.image}
          width={1200}
          height={630}
          alt={data.title}
          priority={priority}
        />
      )}
      {!data.image && <div className="bg-gray-200 h-[180px] mb-4 rounded" />}
      <p className="my-2">
        <time
          dateTime={data.publishedAt}
          className="text-xs text-muted-foreground"
        >
          {formatDate(data.publishedAt)}
        </time>
      </p>
      <h3 className="text-xl font-medium mb-2">{data.title}</h3>
      <p className="text-muted-foreground">{data.summary}</p>
    </Link>
  );
}
