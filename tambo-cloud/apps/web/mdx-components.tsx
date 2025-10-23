import { cn } from "@/lib/utils";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import { BlogPost } from "./components/blog/blog-post";
import { ImageZoom } from "./components/ui/shadcn-io/image-zoom";

/**
 * MDX Components Configuration
 *
 * This function is automatically consumed by Nextra.
 *
 * Nextra automatically detects and utilizes this function to customize the rendering
 * of MDX content across the application.
 *
 * This function does not need to be imported explicitly elsewhere in the codebase.
 * Nextra automatically recognizes and applies it during the MDX compilation process.
 *
 * You can also add custom components to this function to use them in the MDX files.
 *
 * @example
 * ```tsx
 * export function useMDXComponents(components: MDXComponents): MDXComponents {
 *   return {
 *     ...components,
 *     MyCustomComponent,
 *   };
 * }
 * ```
 *
 * @param components - Additional MDX components to merge
 * @returns Enhanced MDX components with custom styling
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    BlogPost,
    ImageZoom,

    h1: ({ className, ...props }) => (
      <h1
        className={cn("text-center font-bold text-5xl mb-6 mt-12", className)}
        {...props}
      />
    ),

    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight text-gray-900 mt-10 mb-4 border-b border-gray-200 pb-2",
          className,
        )}
        {...props}
      />
    ),

    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          "text-2xl font-semibold tracking-tight text-gray-900 mt-8 mb-3",
          className,
        )}
        {...props}
      />
    ),

    h4: ({ className, ...props }) => (
      <h4
        className={cn(
          "text-xl font-semibold tracking-tight text-gray-900 mt-6 mb-2",
          className,
        )}
        {...props}
      />
    ),

    h5: ({ className, ...props }) => (
      <h5
        className={cn(
          "text-lg font-semibold tracking-tight text-gray-900 mt-4 mb-2",
          className,
        )}
        {...props}
      />
    ),

    h6: ({ className, ...props }) => (
      <h6
        className={cn(
          "text-base font-semibold tracking-tight text-gray-900 mt-4 mb-2",
          className,
        )}
        {...props}
      />
    ),

    p: ({ className, ...props }) => (
      <p
        className={cn(
          "font-sans leading-7 text-gray-700 my-4 [&:not(:first-child)]:mt-6 text-justify",
          className,
        )}
        {...props}
      />
    ),

    a: ({ className, ...props }) => (
      <a
        className={cn(
          "font-medium rounded hover:bg-blue-50 underline transition-colors inline-flex items-center",
          className,
        )}
        {...props}
      />
    ),

    ul: ({ className, ...props }) => (
      <ul
        className={cn("list-disc pl-6 my-6 space-y-2 text-gray-700", className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn(
          "list-decimal pl-6 my-6 space-y-2 text-gray-700",
          className,
        )}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li
        className={cn("leading-7 [&>ul]:my-2 [&>ol]:my-2", className)}
        {...props}
      />
    ),

    code: ({ className, ...props }) => (
      <code
        className={cn(
          "font-mono text-sm px-2 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200",
          className,
        )}
        {...props}
      />
    ),

    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          "rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-x-auto my-6 text-sm font-mono",
          "[&>code]:bg-transparent [&>code]:border-none [&>code]:p-0",
          className,
        )}
        {...props}
      />
    ),

    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "border-l-4 border-blue-500 pl-6 pr-4 py-2 my-6 italic text-gray-700 bg-blue-50/50 rounded-r-lg",
          className,
        )}
        {...props}
      />
    ),

    table: ({ className, ...props }) => (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table
          className={cn("w-full text-left border-collapse text-sm", className)}
          {...props}
        />
      </div>
    ),
    thead: ({ className, ...props }) => (
      <thead className={cn("bg-gray-100", className)} {...props} />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          "border-b border-r border-gray-200 px-4 py-3 font-semibold text-gray-900 text-left bg-gray-100",
          className,
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className={cn(
          "border-b border-r border-gray-200 px-4 py-3 text-gray-700 bg-white",
          className,
        )}
        {...props}
      />
    ),

    hr: ({ className, ...props }) => (
      <hr
        className={cn(
          "my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent",
          className,
        )}
        {...props}
      />
    ),

    img: ({ className, src, alt, width, height, ...props }) => {
      if (!src) return null;

      const w = typeof width === "string" ? parseInt(width, 10) : width;
      const h = typeof height === "string" ? parseInt(height, 10) : height;

      return (
        <Image
          src={src}
          alt={alt || ""}
          width={w ?? 800}
          height={h ?? 800}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
          className={cn(
            "rounded-lg max-w-full h-auto my-6 shadow-lg border border-gray-200 mx-auto",
            className,
          )}
          {...props}
        />
      );
    },

    strong: ({ className, ...props }) => (
      <strong className={cn("font-bold text-gray-900", className)} {...props} />
    ),

    em: ({ className, ...props }) => (
      <em className={cn("italic text-gray-700", className)} {...props} />
    ),

    del: ({ className, ...props }) => (
      <del className={cn("line-through text-gray-500", className)} {...props} />
    ),

    mark: ({ className, ...props }) => (
      <mark
        className={cn(
          "bg-yellow-200 px-1 py-0.5 rounded text-gray-900",
          className,
        )}
        {...props}
      />
    ),

    kbd: ({ className, ...props }) => (
      <kbd
        className={cn(
          "font-mono text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 shadow-sm",
          className,
        )}
        {...props}
      />
    ),

    var: ({ className, ...props }) => (
      <var
        className={cn("font-mono text-sm italic text-blue-600", className)}
        {...props}
      />
    ),

    dl: ({ className, ...props }) => (
      <dl className={cn("my-6 space-y-4", className)} {...props} />
    ),
    dt: ({ className, ...props }) => (
      <dt className={cn("font-semibold text-gray-900", className)} {...props} />
    ),
    dd: ({ className, ...props }) => (
      <dd className={cn("ml-4 text-gray-700", className)} {...props} />
    ),

    details: ({ className, ...props }) => (
      <details
        className={cn(
          "my-6 border border-gray-200 rounded-lg p-4 bg-gray-50",
          className,
        )}
        {...props}
      />
    ),
    summary: ({ className, ...props }) => (
      <summary
        className={cn(
          "font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors",
          className,
        )}
        {...props}
      />
    ),

    figure: ({ className, ...props }) => (
      <figure className={cn("my-6", className)} {...props} />
    ),
    figcaption: ({ className, ...props }) => (
      <figcaption
        className={cn(
          "text-sm text-gray-600 text-center mt-2 italic font-sans",
          className,
        )}
        {...props}
      />
    ),

    ...components,
  };
}
