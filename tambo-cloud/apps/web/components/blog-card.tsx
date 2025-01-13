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
      className="bg-white dark:bg-zinc-900 transition-all hover:bg-secondary/10 dark:hover:bg-secondary/10 p-6 last:border-b-0 lg:border-r last:lg:border-r-0 border-b lg:border-b-0 dark:border-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:shadow-zinc-900/50 hover:scale-[1.02]"
    >
      {data.image && (
        <Image
          className="object-cover border dark:border-gray-800 rounded-md hover:opacity-90 transition-opacity"
          src={data.image}
          width={1200}
          height={630}
          alt={data.title}
          priority={priority}
        />
      )}
      {!data.image && (
        <div className="bg-gray-200 dark:bg-gray-800 h-[180px] mb-4 rounded-md" />
      )}
      <p className="my-3">
        <time
          dateTime={data.publishedAt}
          className="text-xs text-muted-foreground dark:text-gray-400 font-medium"
        >
          {formatDate(data.publishedAt)}
        </time>
      </p>
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
        {data.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
        {data.summary}
      </p>
    </Link>
  );
}
