<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { Check } from "lucide-svelte";
  import { z } from "zod";

  // Schema definition
  const dataCardSchema = z.object({
    title: z.string().describe("Title displayed above the data cards"),
    options: z
      .array(
        z.object({
          id: z.string().describe("Unique identifier for this card"),
          label: z.string().describe("Display text for the card title"),
          value: z.string().describe("Value associated with this card"),
          description: z.string().optional().describe("Optional summary for the card"),
          url: z.string().optional().describe("Optional URL for the card to navigate to"),
        })
      )
      .describe("Array of selectable cards to display"),
  });

  type DataCardProps = z.infer<typeof dataCardSchema>;

  interface Props extends DataCardProps {
    class?: string;
  }

  let { title, options, class: className }: Props = $props();

  // Local state for selections
  let selectedValues = $state<string[]>([]);

  function handleToggleCard(value: string) {
    const index = selectedValues.indexOf(value);
    if (index > -1) {
      selectedValues = selectedValues.filter((v) => v !== value);
    } else {
      selectedValues = [...selectedValues, value];
    }
  }

  function handleNavigate(url?: string) {
    if (url) {
      window.open(url, "_blank");
    }
  }

  function isSelected(value: string): boolean {
    return selectedValues.includes(value);
  }
</script>

<div class={cn("w-full", className)}>
  {#if title}
    <h2 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</h2>
  {/if}

  <div class="space-y-2">
    {#each options || [] as card, index (card.id || `card-${index}`)}
      <div class="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
        <div
          class={cn(
            "group flex items-start p-1.5 rounded-md transition-colors",
            isSelected(card.value) && "bg-gray-50 dark:bg-gray-800"
          )}
        >
          <!-- Checkbox -->
          <button
            type="button"
            class="flex-shrink-0 mr-3 mt-0.5 cursor-pointer"
            onclick={() => handleToggleCard(card.value)}
          >
            <div
              class={cn(
                "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors",
                isSelected(card.value)
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
              )}
            >
              {#if isSelected(card.value)}
                <Check class="h-2.5 w-2.5" />
              {/if}
            </div>
          </button>

          <!-- Content -->
          <button
            type="button"
            class="flex-1 text-left cursor-pointer"
            onclick={() =>
              card.url ? handleNavigate(card.url) : handleToggleCard(card.value)
            }
          >
            <h3
              class={cn(
                "text-blue-600 dark:text-blue-400 font-medium text-sm",
                "group-hover:text-blue-700 dark:group-hover:text-blue-300",
                isSelected(card.value) && "text-blue-700 dark:text-blue-300"
              )}
            >
              {card.label}
            </h3>
            {#if card.description}
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {card.description}
              </p>
            {/if}
            {#if card.url}
              <span class="text-xs text-green-600 dark:text-green-400 mt-1 block truncate opacity-80">
                {card.url}
              </span>
            {/if}
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
