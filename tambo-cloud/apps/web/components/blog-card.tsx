import { Post } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function BlogListItem({
  data,
  priority,
}: {
  data: Post;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/blog/${data.slug}`}
      className="flex flex-col md:flex-row gap-4 md:gap-5 p-4 md:p-5 border-b last:border-b-0 dark:border-gray-800 hover:bg-background/50 dark:hover:bg-background/30 transition-colors rounded-lg"
    >
      {data.image && (
        <div className="md:w-1/4 overflow-hidden rounded-md">
          <Image
            className="object-cover w-full h-40 md:h-full rounded-md hover:opacity-90 transition-opacity"
            src={data.image}
            width={400}
            height={225}
            alt={data.title}
            priority={priority}
          />
        </div>
      )}
      {!data.image && (
        <div className="md:w-1/4 bg-gray-200 dark:bg-gray-800 h-40 rounded-md" />
      )}

      <div className="md:w-3/4 flex flex-col">
        <time
          dateTime={data.publishedAt}
          className="text-xs text-muted-foreground dark:text-gray-400 font-medium mb-1"
        >
          {formatDate(data.publishedAt)}
        </time>

        <h3 className="text-xl font-heading font-bold mb-2 text-foreground">
          {data.title}
        </h3>

        <p className="text-muted-foreground line-clamp-2 md:line-clamp-3 mb-3">
          {data.summary}
        </p>

        <div className="mt-auto flex items-center text-sm text-accent hover:text-accent/80 transition-colors">
          <span>Read article</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </div>
      </div>
    </Link>
  );
}
