"use client";

import { cn } from "@/lib/utils";
import * as Popover from "@radix-ui/react-popover";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import {
  EditorContent,
  Extension,
  useEditor,
  type Editor,
} from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";
import { Cuboid, FileText } from "lucide-react";
import * as React from "react";
import {
  createContext,
  useContext,
  useImperativeHandle,
  useState,
} from "react";

/**
 * Minimal editor interface exposed to parent components.
 * Hides TipTap implementation details and exposes only necessary operations.
 */
export interface TamboEditor {
  /** Focus the editor at a specific position */
  focus(position?: "start" | "end"): void;
  /** Set the editor content */
  setContent(content: string): void;
  /** Append text to the end of the editor content */
  appendText(text: string): void;
  /** Get the text and resource names */
  getTextWithResourceURIs(): {
    text: string;
    resourceNames: Record<string, string>;
  };
  /** Check if a mention with the given id exists */
  hasMention(id: string): boolean;
  /** Insert a mention node with a following space */
  insertMention(id: string, label: string): void;
  /** Set whether the editor is editable */
  setEditable(editable: boolean): void;
}

/**
 * Represents a resource item that appears in the "@" mention dropdown.
 * Resources are referenced by ID/URI and appear as visual mention nodes in the editor.
 */
export interface ResourceItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

/**
 * Represents a prompt item that appears in the "/" command dropdown.
 * Prompts contain text that gets inserted into the editor.
 */
export interface PromptItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  /** The actual prompt text to insert into the editor */
  text: string;
}

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onResourceNamesChange: (
    resourceNames:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Submit handler for Enter key behavior */
  onSubmit: (e: React.FormEvent) => Promise<void>;
  /** Called when an image is pasted into the editor */
  onAddImage: (file: File) => Promise<void>;
  /** Search for resources matching the query (for "@" mentions) */
  onSearchResources: (query: string) => Promise<ResourceItem[]>;
  /** Search for prompts matching the query (for "/" commands) */
  onSearchPrompts: (query: string) => Promise<PromptItem[]>;
  /** Called when a resource is selected from the "@" menu */
  onResourceSelect: (item: ResourceItem) => void;
  /** Called when a prompt is selected from the "/" menu */
  onPromptSelect: (item: PromptItem) => void;
}

/**
 * State for resource suggestion popover.
 */
interface ResourceSuggestionState {
  isOpen: boolean;
  items: ResourceItem[];
  selectedIndex: number;
  position: { top: number; left: number; lineHeight: number } | null;
  command: ((item: ResourceItem) => void) | null;
}

/**
 * State for prompt suggestion popover.
 */
interface PromptSuggestionState {
  isOpen: boolean;
  items: PromptItem[];
  selectedIndex: number;
  position: { top: number; left: number; lineHeight: number } | null;
  command: ((item: PromptItem) => void) | null;
}

/**
 * Context value for suggestion management.
 */
interface SuggestionContextValue<T> {
  state: T;
  setState: (update: Partial<T>) => void;
}

const ResourceSuggestionContext =
  createContext<SuggestionContextValue<ResourceSuggestionState> | null>(null);

const PromptSuggestionContext =
  createContext<SuggestionContextValue<PromptSuggestionState> | null>(null);

/**
 * Hook to access resource suggestion context.
 */
function useResourceSuggestion() {
  const context = useContext(ResourceSuggestionContext);
  if (!context) {
    throw new Error(
      "useResourceSuggestion must be used within ResourceSuggestionProvider",
    );
  }
  return context;
}

/**
 * Hook to access prompt suggestion context.
 */
function usePromptSuggestion() {
  const context = useContext(PromptSuggestionContext);
  if (!context) {
    throw new Error(
      "usePromptSuggestion must be used within PromptSuggestionProvider",
    );
  }
  return context;
}

/**
 * Provider for resource suggestion state.
 */
function ResourceSuggestionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setStateInternal] = useState<ResourceSuggestionState>({
    isOpen: false,
    items: [],
    selectedIndex: 0,
    position: null,
    command: null,
  });

  const setState = React.useCallback(
    (update: Partial<ResourceSuggestionState>) => {
      setStateInternal((prev) => ({ ...prev, ...update }));
    },
    [],
  );

  const value = React.useMemo(() => ({ state, setState }), [state, setState]);

  return (
    <ResourceSuggestionContext.Provider value={value}>
      {children}
    </ResourceSuggestionContext.Provider>
  );
}

/**
 * Provider for prompt suggestion state.
 */
function PromptSuggestionProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<PromptSuggestionState>({
    isOpen: false,
    items: [],
    selectedIndex: 0,
    position: null,
    command: null,
  });

  const setState = React.useCallback(
    (update: Partial<PromptSuggestionState>) => {
      setStateInternal((prev) => ({ ...prev, ...update }));
    },
    [],
  );

  const value = React.useMemo(() => ({ state, setState }), [state, setState]);

  return (
    <PromptSuggestionContext.Provider value={value}>
      {children}
    </PromptSuggestionContext.Provider>
  );
}

/**
 * Utility function to convert TipTap clientRect to position coordinates.
 * Includes line height for proper spacing when popup flips above cursor.
 */
function getPositionFromClientRect(
  clientRect?: (() => DOMRect | null) | null,
): { top: number; left: number; lineHeight: number } | null {
  if (!clientRect) return null;
  const rect = clientRect();
  if (!rect) return null;
  const lineHeight = rect.height || 20; // Fallback to 20px if height not available
  return { top: rect.bottom, left: rect.left, lineHeight };
}

/**
 * Popover component for resource (@) suggestions.
 * Renders a positioned popover at the cursor location with the resource item list.
 */
function ResourceSuggestionPopover() {
  const { state, setState } = useResourceSuggestion();

  if (!state.isOpen || !state.position) return null;

  // Use line height + small padding for vertical offset
  // When popup appears above cursor, this ensures text stays visible
  const sideOffset = state.position.lineHeight + 4;

  return (
    <Popover.Root
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open) setState({ isOpen: false });
      }}
    >
      <Popover.Anchor asChild>
        <div
          style={{
            position: "fixed",
            top: `${state.position.top}px`,
            left: `${state.position.left}px`,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Popover.Anchor>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        className="z-50 w-96 rounded-md border bg-popover p-0 shadow-md animate-in fade-in-0 zoom-in-95"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          setState({ isOpen: false });
        }}
      >
        <ResourceItemList />
      </Popover.Content>
    </Popover.Root>
  );
}

/**
 * Popover component for prompt (/) suggestions.
 * Renders a positioned popover at the cursor location with the prompt item list.
 */
function PromptSuggestionPopover() {
  const { state, setState } = usePromptSuggestion();

  if (!state.isOpen || !state.position) return null;

  // Use line height + small padding for vertical offset
  // When popup appears above cursor, this ensures text stays visible
  const sideOffset = state.position.lineHeight + 4;

  return (
    <Popover.Root
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open) setState({ isOpen: false });
      }}
    >
      <Popover.Anchor asChild>
        <div
          style={{
            position: "fixed",
            top: `${state.position.top}px`,
            left: `${state.position.left}px`,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Popover.Anchor>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        className="z-50 w-96 rounded-md border bg-popover p-0 shadow-md animate-in fade-in-0 zoom-in-95"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          setState({ isOpen: false });
        }}
      >
        <PromptItemList />
      </Popover.Content>
    </Popover.Root>
  );
}

/**
 * Dropdown component that displays resource items.
 *
 * When the user types "@" in the editor, this component renders a list
 * of resource items. State is managed via ResourceSuggestionContext.
 *
 */
function ResourceItemList() {
  const { state } = useResourceSuggestion();
  const { items, selectedIndex, command } = state;

  if (items.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            index === selectedIndex && "bg-accent text-accent-foreground",
          )}
          onClick={() => command?.(item)}
        >
          {item.icon ?? <Cuboid className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-xs text-muted-foreground truncate font-mono">
              {item.id}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Internal helper to check if a mention exists in a raw TipTap Editor.
 * Used within the suggestion plugin where we only have access to the Editor instance.
 */
function checkMentionExists(editor: Editor, label: string): boolean {
  if (!editor.state?.doc) return false;
  let exists = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        exists = true;
        return false; // Stop traversing
      }
    }
    return true;
  });
  return exists;
}

/**
 * Creates the resource mention configuration for TipTap Mention extension.
 * Used for "@" mentions that insert visual mention nodes in the editor.
 */
function createResourceMentionConfig(
  searchResources: (query: string) => Promise<ResourceItem[]>,
  onSelect: (item: ResourceItem) => void,
  contextRef: React.MutableRefObject<
    SuggestionContextValue<ResourceSuggestionState>
  >,
): Omit<SuggestionOptions, "editor"> {
  return {
    char: "@",
    items: async ({ query }) => {
      try {
        return await searchResources(query);
      } catch (error) {
        console.error("Failed to fetch resources", error);
        return [];
      }
    },

    render: () => {
      const createWrapCommand =
        (
          editor: Editor,
          tiptapCommand: (attrs: { id: string; label: string }) => void,
        ) =>
        (item: ResourceItem) => {
          // Check if mention already exists in the editor
          if (checkMentionExists(editor, item.name)) {
            return;
          }

          // Insert the mention node
          tiptapCommand({ id: item.id, label: item.name });
          // Call selection handler
          onSelect(item);
        };

      return {
        onStart: (props) => {
          const { setState } = contextRef.current;

          if (props.items.length === 0) {
            setState({ isOpen: false });
            return;
          }

          setState({
            isOpen: true,
            items: props.items,
            selectedIndex: 0,
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
          });
        },
        onUpdate: (props) => {
          const { setState } = contextRef.current;

          if (props.items.length === 0) {
            setState({ isOpen: false });
            return;
          }

          setState({
            items: props.items,
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
            selectedIndex: 0, // Reset selection when items change
          });
        },
        onKeyDown: ({ event }) => {
          const { state, setState } = contextRef.current;

          if (!state.isOpen) return false;

          const handlers: Record<string, () => boolean> = {
            ArrowUp: () => {
              setState({
                selectedIndex:
                  (state.selectedIndex - 1 + state.items.length) %
                  state.items.length,
              });
              return true;
            },
            ArrowDown: () => {
              setState({
                selectedIndex: (state.selectedIndex + 1) % state.items.length,
              });
              return true;
            },
            Enter: () => {
              const item = state.items[state.selectedIndex];
              if (item && state.command) {
                state.command(item);
                return true;
              }
              return false;
            },
            Escape: () => {
              setState({ isOpen: false });
              return true;
            },
          };

          const handler = handlers[event.key];
          if (handler) {
            event.preventDefault();
            return handler();
          }

          return false;
        },
        onExit: () => {
          const { setState } = contextRef.current;
          setState({ isOpen: false });
        },
      };
    },
  };
}

/**
 * Dropdown component for displaying prompt items.
 * State is managed via PromptSuggestionContext.
 */
function PromptItemList() {
  const { state } = usePromptSuggestion();
  const { items, selectedIndex, command } = state;

  if (items.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No prompts found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            index === selectedIndex && "bg-accent text-accent-foreground",
          )}
          onClick={() => command?.(item)}
        >
          {item.icon ?? <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {item.id}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Creates a custom TipTap extension for prompt commands using the Suggestion plugin.
 * Unlike Mention, this doesn't create special nodes - it just triggers text insertion.
 */
function createPromptCommandExtension(
  searchPrompts: (query: string) => Promise<PromptItem[]>,
  onSelect: (item: PromptItem) => void,
  contextRef: React.MutableRefObject<
    SuggestionContextValue<PromptSuggestionState>
  >,
) {
  return Extension.create({
    name: "promptCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          items: async ({ query, editor }) => {
            try {
              // Only show prompts when editor is empty (except for the "/" char)
              const editorValue = editor.getText().replace("/", "").trim();
              if (editorValue.length > 0) {
                return [];
              }
              return await searchPrompts(query);
            } catch (error) {
              console.error("Failed to fetch prompts", error);
              return [];
            }
          },
          render: () => {
            return {
              onStart: (props) => {
                const { setState } = contextRef.current;

                if (props.items.length === 0) {
                  setState({ isOpen: false });
                  return;
                }

                setState({
                  isOpen: true,
                  items: props.items,
                  selectedIndex: 0,
                  position: getPositionFromClientRect(props.clientRect),
                  command: (item: PromptItem) => {
                    // Delete the "/" trigger character and any typed text
                    props.editor.commands.deleteRange({
                      from: props.range.from,
                      to: props.range.to,
                    });
                    // Call selection handler which will insert the prompt text
                    onSelect(item);
                  },
                });
              },
              onUpdate: (props) => {
                const { setState } = contextRef.current;

                if (props.items.length === 0) {
                  setState({ isOpen: false });
                  return;
                }

                setState({
                  items: props.items,
                  position: getPositionFromClientRect(props.clientRect),
                  selectedIndex: 0, // Reset selection when items change
                  command: (item: PromptItem) => {
                    props.editor.commands.deleteRange({
                      from: props.range.from,
                      to: props.range.to,
                    });
                    onSelect(item);
                  },
                });
              },
              onKeyDown: ({ event }) => {
                const { state, setState } = contextRef.current;

                if (!state.isOpen) return false;

                const handlers: Record<string, () => boolean> = {
                  ArrowUp: () => {
                    setState({
                      selectedIndex:
                        (state.selectedIndex - 1 + state.items.length) %
                        state.items.length,
                    });
                    return true;
                  },
                  ArrowDown: () => {
                    setState({
                      selectedIndex:
                        (state.selectedIndex + 1) % state.items.length,
                    });
                    return true;
                  },
                  Enter: () => {
                    const item = state.items[state.selectedIndex];
                    if (item && state.command) {
                      state.command(item);
                      return true;
                    }
                    return false;
                  },
                  Escape: () => {
                    setState({ isOpen: false });
                    return true;
                  },
                };

                const handler = handlers[event.key];
                if (handler) {
                  event.preventDefault();
                  return handler();
                }

                return false;
              },
              onExit: () => {
                const { setState } = contextRef.current;
                setState({ isOpen: false });
              },
            };
          },
        }),
      ];
    },
  });
}

/**
 * Custom text extraction that serializes mention nodes with their ID (resource URI).
 * Returns both the text (with URIs only) and a map of URI -> name for lookups.
 * This avoids string manipulation issues with names containing special characters.
 */
function getTextWithResourceURIs(editor: Editor | null): {
  text: string;
  resourceNames: Record<string, string>;
} {
  if (!editor?.state?.doc) return { text: "", resourceNames: {} };

  let text = "";
  const resourceNames: Record<string, string> = {};

  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const id = node.attrs.id ?? "";
      const label = node.attrs.label ?? "";
      // Only include URI in text (no name to avoid parsing issues)
      text += `@${id}`;
      // Store name separately for lookup
      if (label && id) {
        resourceNames[id] = label;
      }
    } else if (node.type.name === "hardBreak") {
      // Convert hard breaks (Shift+Enter) to newlines
      text += "\n";
    } else if (node.isText) {
      text += node.text;
    }
    return true;
  });

  return { text, resourceNames };
}

/**
 * Text editor component with resource ("@") and prompt ("/") support.
 */
export const TextEditor = React.forwardRef<TamboEditor, TextEditorProps>(
  (
    {
      value,
      onChange,
      onResourceNamesChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      onSubmit,
      onAddImage,
      onSearchResources,
      onSearchPrompts,
      onResourceSelect,
      onPromptSelect,
    },
    ref,
  ) => {
    return (
      <ResourceSuggestionProvider>
        <PromptSuggestionProvider>
          <TextEditorInner
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            onSubmit={onSubmit}
            onAddImage={onAddImage}
            onSearchResources={onSearchResources}
            onSearchPrompts={onSearchPrompts}
            onResourceSelect={onResourceSelect}
            onPromptSelect={onPromptSelect}
            onResourceNamesChange={onResourceNamesChange}
            ref={ref}
          />
        </PromptSuggestionProvider>
      </ResourceSuggestionProvider>
    );
  },
);

TextEditor.displayName = "TextEditor";

/**
 * Inner text editor component that uses the suggestion contexts.
 */
const TextEditorInner = React.forwardRef<TamboEditor, TextEditorProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      onSubmit,
      onAddImage,
      onSearchResources,
      onSearchPrompts,
      onResourceSelect,
      onPromptSelect,
      onResourceNamesChange,
    },
    ref,
  ) => {
    // Access contexts
    const resourceSuggestion = useResourceSuggestion();
    const promptSuggestion = usePromptSuggestion();

    // Store each callback in its own ref so TipTap always calls the latest version
    const onSearchResourcesRef = React.useRef(onSearchResources);
    const onSearchPromptsRef = React.useRef(onSearchPrompts);
    const onResourceSelectRef = React.useRef(onResourceSelect);
    const onPromptSelectRef = React.useRef(onPromptSelect);

    // Store context refs for TipTap integration
    const resourceSuggestionRef = React.useRef(resourceSuggestion);
    const promptSuggestionRef = React.useRef(promptSuggestion);

    // Update refs whenever callbacks or context changes
    React.useEffect(() => {
      onSearchResourcesRef.current = onSearchResources;
    }, [onSearchResources]);

    React.useEffect(() => {
      onSearchPromptsRef.current = onSearchPrompts;
    }, [onSearchPrompts]);

    React.useEffect(() => {
      onResourceSelectRef.current = onResourceSelect;
    }, [onResourceSelect]);

    React.useEffect(() => {
      onPromptSelectRef.current = onPromptSelect;
    }, [onPromptSelect]);

    React.useEffect(() => {
      resourceSuggestionRef.current = resourceSuggestion;
    }, [resourceSuggestion]);

    React.useEffect(() => {
      promptSuggestionRef.current = promptSuggestion;
    }, [promptSuggestion]);

    // Create stable callbacks that forward to refs
    const stableSearchResources = React.useCallback(
      async (query: string) => await onSearchResourcesRef.current(query),
      [],
    );

    const stableSearchPrompts = React.useCallback(
      async (query: string) => await onSearchPromptsRef.current(query),
      [],
    );

    // Handle resource selection
    const handleResourceSelect = React.useCallback(
      (item: ResourceItem) => onResourceSelectRef.current(item),
      [],
    );

    // Handle prompt selection
    const handlePromptSelect = React.useCallback(
      (item: PromptItem) => onPromptSelectRef.current(item),
      [],
    );

    // Handle Enter key to submit message
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        // Handle Enter key behavior
        if (e.key === "Enter" && !e.shiftKey && value.trim()) {
          e.preventDefault();
          void onSubmit(e as React.FormEvent);
          return;
        }

        // Delegate to provided onKeyDown handler
        if (onKeyDown) {
          onKeyDown(e);
        }
      },
      [onSubmit, value, onKeyDown],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak,
        Placeholder.configure({ placeholder }),
        // Always register the "@" mention extension for resources
        // Visual display uses label, but getTextWithResourceURIs() will use ID
        Mention.configure({
          HTMLAttributes: {
            class:
              "mention resource inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          },
          suggestion: createResourceMentionConfig(
            stableSearchResources,
            handleResourceSelect,
            resourceSuggestionRef,
          ),
          renderLabel: ({ node }) => `@${(node.attrs.label as string) ?? ""}`,
        }),
        // Always register the "/" command extension for prompts
        createPromptCommandExtension(
          stableSearchPrompts,
          handlePromptSelect,
          promptSuggestionRef,
        ),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        // Extract text and resource names, notify parent - editor is the source of truth for user input
        const { text, resourceNames } = getTextWithResourceURIs(editor);
        // Only update the value prop if it's different from what we're about to set
        // This prevents unnecessary updates that could trigger syncing and replace mention nodes
        if (text !== value) {
          onChange(text);
        }
        if (onResourceNamesChange) {
          // Merge with existing state to preserve resource names that might not be in current editor state
          onResourceNamesChange((prev) => ({ ...prev, ...resourceNames }));
        }
      },
      editorProps: {
        attributes: {
          class: cn(
            "tiptap",
            "prose prose-sm max-w-none focus:outline-none",
            "p-3 rounded-t-lg bg-transparent text-sm leading-relaxed",
            "min-h-[82px] max-h-[40vh] overflow-y-auto",
            "break-words whitespace-pre-wrap",
            className,
          ),
        },
        handlePaste: (_view, event) => {
          const items = Array.from(event.clipboardData?.items ?? []);
          const imageItems = items.filter((item) =>
            item.type.startsWith("image/"),
          );

          // If there are no images, let TipTap handle the paste normally
          if (imageItems.length === 0) {
            return false;
          }

          const text = event.clipboardData?.getData("text/plain") ?? "";
          const hasText = text.length > 0;

          // Only prevent default when it's an image-only paste so users can still
          // paste mixed text + images and keep the text in the editor
          if (!hasText) {
            event.preventDefault();
          }

          void (async () => {
            for (const item of imageItems) {
              const file = item.getAsFile();
              if (!file) continue;
              try {
                await onAddImage(file);
              } catch (error) {
                console.error("Failed to add pasted image:", error);
              }
            }
          })();

          // For pure image pastes we've already prevented the default and
          // signal that the event was handled. For mixed text+image pastes,
          // return false so TipTap can still process the text payload.
          return !hasText;
        },
        handleKeyDown: (_view, event) => {
          // Check if any menu is open ("@" or "/")
          const anyMenuOpen =
            resourceSuggestionRef.current.state.isOpen ||
            promptSuggestionRef.current.state.isOpen;

          // When menu is open, let the suggestion plugin handle keyboard events
          // (ArrowUp, ArrowDown, Enter, Escape). Returning false allows the
          // event to propagate to the suggestion plugin's onKeyDown handler.
          if (anyMenuOpen) {
            return false;
          }

          // Only handle Enter key for form submission - let TipTap handle everything else
          if (event.key === "Enter" && !event.shiftKey && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            handleKeyDown(reactEvent);
            return reactEvent.defaultPrevented;
          }

          // For all other keys (including Shift+Enter), let TipTap handle them
          return false;
        },
      },
    });

    // Expose TamboEditor interface via ref
    useImperativeHandle(ref, () => {
      if (!editor) {
        // Return a no-op implementation if editor isn't ready yet
        return {
          focus: () => {},
          setContent: () => {},
          appendText: () => {},
          getTextWithResourceURIs: () => ({ text: "", resourceNames: {} }),
          hasMention: () => false,
          insertMention: () => {},
          setEditable: () => {},
        };
      }

      return {
        focus: (position?: "start" | "end") => {
          if (position) {
            editor.commands.focus(position);
          } else {
            editor.commands.focus();
          }
        },
        setContent: (content: string) => {
          editor.commands.setContent(content);
        },
        appendText: (text: string) => {
          editor.chain().focus("end").insertContent(text).run();
        },
        getTextWithResourceURIs: () => {
          return getTextWithResourceURIs(editor);
        },
        hasMention: (id: string) => {
          if (!editor.state?.doc) return false;
          let exists = false;
          editor.state.doc.descendants((node) => {
            if (node.type.name === "mention") {
              const mentionId = node.attrs.id as string;
              if (mentionId === id) {
                exists = true;
                return false; // Stop traversing
              }
            }
            return true;
          });
          return exists;
        },
        insertMention: (id: string, label: string) => {
          editor
            .chain()
            .focus()
            .insertContent([
              { type: "mention", attrs: { id, label } },
              { type: "text", text: " " },
            ])
            .run();
        },
        setEditable: (editable: boolean) => {
          editor.setEditable(editable);
        },
      };
    }, [editor]);

    // Sync external value changes and disabled state with editor
    // Only sync when value changes externally (not from our own onUpdate)
    // We track the last value we set to distinguish external vs internal changes
    const lastSyncedValueRef = React.useRef<string>(value);

    React.useEffect(() => {
      if (!editor) return;

      const { text: currentText } = getTextWithResourceURIs(editor);

      // Only sync if:
      // 1. Value is different from what's in the editor, AND
      // 2. Value is different from what we last synced (meaning it's an external change)
      // This prevents syncing when our own onUpdate updates the value prop
      // IMPORTANT: If value === currentText, don't sync - this means the value prop
      // is just the serialized form of what's already in the editor (with mention nodes),
      // and syncing would replace the mention nodes with plain text
      if (value !== currentText && value !== lastSyncedValueRef.current) {
        // External value change - sync it to editor
        editor.commands.setContent(value);
        lastSyncedValueRef.current = value;
      } else if (value === currentText) {
        // Value matches editor content - update our tracking but don't sync
        // (editor already has the right content with mention nodes)
        lastSyncedValueRef.current = value;
      }
      // If value === currentText, we don't sync - editor already has the right content

      editor.setEditable(!disabled);
    }, [editor, value, disabled]);

    return (
      <div className="w-full">
        <ResourceSuggestionPopover />
        <PromptSuggestionPopover />
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditorInner.displayName = "TextEditorInner";
