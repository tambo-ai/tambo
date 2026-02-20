# Real-World Example: MessageInput Refactoring

This reference shows a real refactoring from this codebase where a 1600-line styled component was reduced to ~1200 lines by composing base components.

## Before: Duplicated Logic

The styled `MessageInput` component duplicated all logic from the base:

```tsx
// components/message-input/message-input.tsx (BEFORE)

// Duplicate context
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error("...");
  }
  return context;
};

// Duplicate internal component with all SDK hooks
const MessageInputInternal = React.forwardRef<HTMLFormElement, Props>(
  ({ children, className, variant, inputRef, ...props }, ref) => {
    // All these hooks duplicated from base!
    const {
      value,
      setValue,
      submit,
      isPending,
      error,
      images,
      addImages,
      removeImage,
    } = useTamboThreadInput();
    const { cancel, thread } = useTamboThread();
    const { elicitation, resolveElicitation } = useTamboElicitationContext();

    // Duplicate state
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [imageError, setImageError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);

    // Duplicate handlers
    const handleSubmit = React.useCallback(
      async (e) => {
        /* ... */
      },
      [
        /* deps */
      ],
    );
    const handleDragEnter = React.useCallback(/* ... */);
    const handleDragLeave = React.useCallback(/* ... */);
    const handleDragOver = React.useCallback(/* ... */);
    const handleDrop = React.useCallback(/* ... */);
    const handleElicitationResponse = React.useCallback(/* ... */);

    // Duplicate context value creation
    const contextValue = React.useMemo(
      () => ({
        /* ... */
      }),
      [
        /* deps */
      ],
    );

    return (
      <MessageInputContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          {...props}
        >
          {/* ... */}
        </form>
      </MessageInputContext.Provider>
    );
  },
);
```

## After: Composing Base Components

```tsx
// components/message-input/message-input.tsx (AFTER)

// Import base components
import { MessageInput as MessageInputBase } from "@tambo-ai/react-ui-base/message-input";

// No duplicate context - use base
// No duplicate hooks - handled by base Root
// No duplicate state - managed by base

const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, inputRef, ...props }, ref) => {
    return (
      <MessageInputBase.Root
        ref={ref}
        inputRef={inputRef as React.RefObject<TamboEditor | null>}
        className={cn(messageInputVariants({ variant }), className)}
        {...props}
      >
        <TooltipProvider>
          {/* Use data-* classes for styling, render props only for behavior changes */}
          <MessageInputBase.Content
            className={cn(
              // 'group' enables group-data-* selectors for child elements
              "group relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3 border",
              // Styling via data attributes on the Content itself
              "border-border data-[dragging]:border-dashed data-[dragging]:border-emerald-400",
            )}
          >
            {/* Render props ONLY for behavior change (elicitation vs normal content) */}
            {({ elicitation, resolveElicitation }) => (
              <>
                {/* Drop overlay uses group-data-* to react to parent's data-dragging */}
                <div className="absolute inset-0 rounded-xl bg-emerald-50/90 items-center justify-center pointer-events-none z-20 hidden group-data-[dragging]:flex">
                  <p className="text-emerald-700 font-medium">
                    Drop files here to add to conversation
                  </p>
                </div>

                {elicitation && resolveElicitation ? (
                  <ElicitationUI
                    request={elicitation}
                    onResponse={resolveElicitation}
                  />
                ) : (
                  <>
                    <MessageInputStagedImages />
                    {children}
                  </>
                )}
              </>
            )}
          </MessageInputBase.Content>
        </TooltipProvider>
      </MessageInputBase.Root>
    );
  },
);
```

## Sub-Component Transformations

### Submit Button

```tsx
// BEFORE
const MessageInputSubmitButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, children, ...props }, ref) => {
    const { isPending } = useMessageInputContext();
    const { cancel, isIdle } = useTamboThread(); // Duplicate hook!
    const isUpdatingToken = useIsTamboTokenUpdating(); // Duplicate hook!

    const showCancelButton = isPending || !isIdle;

    const handleCancel = async (e: React.MouseEvent) => {
      e.preventDefault();
      await cancel();
    };

    return (
      <button
        ref={ref}
        type={showCancelButton ? "button" : "submit"}
        disabled={isUpdatingToken}
        onClick={showCancelButton ? handleCancel : undefined}
        className={buttonClasses}
        {...props}
      >
        {children ?? (showCancelButton ? <Square /> : <ArrowUp />)}
      </button>
    );
  },
);

// AFTER
const MessageInputSubmitButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, children, ...props }, ref) => {
    const buttonClasses = cn("w-10 h-10 bg-foreground ...", className);

    return (
      <MessageInputBase.SubmitButton
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {({ showCancelButton }) =>
          children ?? (showCancelButton ? <Square /> : <ArrowUp />)
        }
      </MessageInputBase.SubmitButton>
    );
  },
);
```

### Staged Images

```tsx
// BEFORE
const MessageInputStagedImages = React.forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }, ref) => {
    const { images, removeImage } = useTamboThreadInput(); // Duplicate hook!
    const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
      null,
    );

    if (images.length === 0) return null;

    return (
      <div ref={ref} className={cn("flex flex-wrap ...", className)} {...props}>
        {images.map((image, index) => (
          <ImageContextBadge
            key={image.id}
            image={image}
            displayName={
              image.file?.[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
            }
            isExpanded={expandedImageId === image.id}
            onToggle={() =>
              setExpandedImageId(expandedImageId === image.id ? null : image.id)
            }
            onRemove={() => removeImage(image.id)}
          />
        ))}
      </div>
    );
  },
);

// AFTER - base pre-computes props, no getter function needed
const MessageInputStagedImages = React.forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <MessageInputBase.StagedImages
        ref={ref}
        className={cn("flex flex-wrap items-center gap-2 ...", className)}
        {...props}
      >
        {({ images }) =>
          images.map((imageProps) => (
            <ImageContextBadge key={imageProps.image.id} {...imageProps} />
          ))
        }
      </MessageInputBase.StagedImages>
    );
  },
);
```

## What Stayed in Styled Layer

1. **Icon factories** - Styled layer provides icon rendering to base hooks
2. **Visual components** - `ImageContextBadge`, `DictationButton`
3. **CSS variants** - `messageInputVariants`
4. **MCP integration components** - `McpPromptButton`, `McpResourceButton`, `McpConfigButton`
5. **Toolbar layout logic** - splitting children to left/right sides
6. **Plain textarea alternative** - `MessageInputPlainTextarea`

## What Moved to Base Layer

Data fetching hooks moved to base as implementation details, with styled layer providing icons:

```tsx
// base/message-input/use-combined-lists.tsx
export function useCombinedResourceList(
  providers: ResourceProvider[] | undefined,
  search: string,
  createMcpIcon?: (serverName: string) => React.ReactNode,
) {
  // Data fetching logic lives in base
  const { data: mcpResources } = useTamboMcpResourceList(search);
  // ... deduplication, filtering, etc.

  // Icon factory keeps styling in styled layer
  return items.map((item) => ({
    ...item,
    icon:
      item.isMcp && createMcpIcon ? createMcpIcon(item.serverName) : item.icon,
  }));
}

// styled/message-input.tsx - passes icon factory
const resources = useCombinedResourceList(providers, search, (serverName) => (
  <McpServerIcon name={serverName} className="w-4 h-4" />
));
```

## Lines Removed

| Component            | Lines Before | Lines After | Reduction |
| -------------------- | ------------ | ----------- | --------- |
| Context/Hook         | ~50          | 0           | -50       |
| MessageInputInternal | ~250         | ~45         | -205      |
| SubmitButton         | ~45          | ~20         | -25       |
| FileButton           | ~55          | ~25         | -30       |
| StagedImages         | ~40          | ~30         | -10       |
| Error                | ~20          | ~10         | -10       |
| **Total**            | **~460**     | **~130**    | **~330**  |

This reduction doesn't count the reuse benefit - the base components are tested once and work correctly everywhere.
