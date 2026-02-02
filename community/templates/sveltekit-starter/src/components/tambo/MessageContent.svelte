<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { marked, type MarkedExtension } from "marked";
  import { markedHighlight } from "marked-highlight";
  import DOMPurify from "dompurify";
  import hljs from "highlight.js";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import type { ContentPart } from "@tambo-ai/svelte";

  interface Props {
    content?: string | ContentPart[] | null;
    isLoading?: boolean;
    markdown?: boolean;
    class?: string;
  }

  let {
    content,
    isLoading = false,
    markdown = true,
    class: className,
  }: Props = $props();

  // Configure marked with syntax highlighting extension
  marked.use(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch {
            return code;
          }
        }
        return hljs.highlightAuto(code).value;
      },
    }) as MarkedExtension,
  );

  /**
   * Get safe content string from various content types
   */
  function getSafeContent(
    content: string | ContentPart[] | null | undefined,
  ): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => (item?.type === "text" ? (item.text ?? "") : ""))
        .join("");
    }
    return "";
  }

  /**
   * Check if content has meaningful data
   */
  function hasContent(
    content: string | ContentPart[] | null | undefined,
  ): boolean {
    if (!content) return false;
    if (typeof content === "string") return content.trim().length > 0;
    if (Array.isArray(content)) {
      return content.some((item) => {
        if (item?.type === "text") return !!item.text?.trim();
        if (item?.type === "image_url") return !!item.image_url?.url;
        return false;
      });
    }
    return false;
  }

  const safeContent = $derived(getSafeContent(content));
  const showLoading = $derived(isLoading && !hasContent(content));

  /**
   * Render markdown to sanitized HTML
   */
  function renderMarkdown(text: string): string {
    if (!text) return "";
    const html = marked.parse(text) as string;
    return DOMPurify.sanitize(html);
  }

  const renderedHtml = $derived(markdown ? renderMarkdown(safeContent) : "");
</script>

<div
  class={cn(
    "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_li]:list-item",
    className,
  )}
  data-slot="message-content"
>
  {#if showLoading}
    <div
      class="flex items-center justify-start h-4 py-1"
      data-slot="message-loading-indicator"
    >
      <LoadingIndicator />
    </div>
  {:else}
    <div
      class={cn("break-words", !markdown && "whitespace-pre-wrap")}
      data-slot="message-content-text"
    >
      {#if !content}
        <span class="text-muted-foreground italic">Empty message</span>
      {:else if markdown}
        <div class="prose prose-sm dark:prose-invert max-w-none">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html renderedHtml}
        </div>
      {:else}
        {safeContent}
      {/if}
    </div>
  {/if}
</div>
