<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { getTamboContext } from "$lib/tambo/context.js";
  import {
    ArrowUp,
    Paperclip,
    Square,
    X,
    Image as ImageIcon,
  } from "lucide-svelte";
  import type { StagedImage } from "$lib/tambo/types.js";

  interface Props {
    contextKey?: string;
    placeholder?: string;
    variant?: "default" | "solid" | "bordered";
    class?: string;
  }

  let {
    contextKey,
    placeholder = "What do you want to do?",
    variant = "default",
    class: className,
  }: Props = $props();

  const tambo = getTamboContext();
  const { thread, input } = tambo;

  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let isDragging = $state(false);
  let submitError = $state<string | null>(null);
  let expandedImageId = $state<string | null>(null);

  // Variant styles
  const variantStyles = {
    default: "",
    solid:
      "[&>div]:bg-background [&>div]:border-0 [&>div]:shadow-xl [&>div]:shadow-black/5",
    bordered: "[&>div]:bg-transparent [&>div]:border-2 [&>div]:border-gray-300",
  };

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if ((!input.value.trim() && input.images.length === 0) || !thread.isIdle) {
      return;
    }

    submitError = null;
    const messageText = input.value;
    const messageImages = [...input.images];

    // Clear input immediately for better UX
    input.setValue("");
    input.clearImages();

    try {
      await thread.sendMessage(messageText, messageImages, true);
      textareaRef?.focus();
    } catch (err) {
      submitError =
        err instanceof Error ? err.message : "Failed to send message";
      // Restore input on error
      input.setValue(messageText);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  async function handleCancel() {
    await thread.cancel();
  }

  // Drag and drop handlers
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) isDragging = true;
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;

    const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > 0) {
      await input.addImages(files);
    }
  }

  // File input handler
  let fileInputRef = $state<HTMLInputElement | null>(null);

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length > 0) {
      await input.addImages(files);
    }
    target.value = "";
  }

  // Paste handler
  async function handlePaste(e: ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    if (imageItems.length > 0) {
      const hasText = (e.clipboardData?.getData("text/plain")?.length || 0) > 0;
      if (!hasText) e.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) await input.addImage(file);
      }
    }
  }

  const isPending = $derived(!thread.isIdle);
</script>

<form
  onsubmit={handleSubmit}
  class={cn("w-full", variantStyles[variant], className)}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <div
    class={cn(
      "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
      isDragging
        ? "border border-dashed border-emerald-400"
        : "border border-border",
    )}
  >
    <!-- Drag overlay -->
    {#if isDragging}
      <div
        class="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20"
      >
        <p class="text-emerald-700 dark:text-emerald-300 font-medium">
          Drop files here to add to conversation
        </p>
      </div>
    {/if}

    <!-- Staged images -->
    {#if input.images.length > 0}
      <div
        class="flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border"
      >
        {#each input.images as image, index}
          <div class="relative group flex-shrink-0">
            <button
              type="button"
              onclick={() =>
                (expandedImageId =
                  expandedImageId === image.id ? null : image.id)}
              class={cn(
                "relative flex items-center rounded-lg border overflow-hidden",
                "border-border bg-background hover:bg-muted cursor-pointer",
                "transition-[width,height,padding] duration-200",
                expandedImageId === image.id
                  ? "w-40 h-28 p-0"
                  : "w-32 h-9 pl-3 pr-8 gap-2",
              )}
            >
              {#if expandedImageId === image.id}
                <div class="absolute inset-0">
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    class="w-full h-full object-cover"
                  />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                  ></div>
                  <div
                    class="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate"
                  >
                    {image.name}
                  </div>
                </div>
              {:else}
                <span
                  class="flex items-center gap-1.5 text-sm text-foreground truncate"
                >
                  <ImageIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate"
                    >{image.name || `Image ${index + 1}`}</span
                  >
                </span>
              {/if}
            </button>
            <button
              type="button"
              onclick={(e) => {
                e.stopPropagation();
                input.removeImage(image.id);
              }}
              class="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Textarea -->
    <textarea
      bind:this={textareaRef}
      value={input.value}
      oninput={(e) => input.setValue(e.currentTarget.value)}
      onkeydown={handleKeyDown}
      onpaste={handlePaste}
      class="flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50"
      disabled={isPending}
      {placeholder}
    ></textarea>

    <!-- Toolbar -->
    <div class="flex justify-between items-center mt-2 p-1 gap-2">
      <div class="flex items-center gap-2">
        <!-- File button -->
        <button
          type="button"
          onclick={() => fileInputRef?.click()}
          class="w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 flex items-center justify-center"
        >
          <Paperclip class="w-4 h-4" />
        </button>
        <input
          bind:this={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onchange={handleFileSelect}
          class="hidden"
        />
      </div>

      <div class="flex items-center gap-2">
        <!-- Submit/Cancel button -->
        <button
          type={isPending ? "button" : "submit"}
          onclick={isPending ? handleCancel : undefined}
          class="w-10 h-10 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-lg hover:bg-black/70 dark:hover:bg-white/80 disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          {#if isPending}
            <Square class="w-4 h-4" fill="currentColor" />
          {:else}
            <ArrowUp class="w-5 h-5" />
          {/if}
        </button>
      </div>
    </div>

    <!-- Error message -->
    {#if submitError}
      <p class="text-sm text-destructive mt-2">{submitError}</p>
    {/if}
  </div>
</form>
