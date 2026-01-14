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
import { useImperativeHandle, useState } from "react";

/**
 * Result of extracting images from clipboard data.
 */
export interface ImageItems {
  imageItems: File[];
  hasText: boolean;
}

/**
 * Returns images array and hasText bool from clipboard data.
 * @param clipboardData - The clipboard data from a paste event
 * @returns Object containing extracted images array and whether text was present
 */
export function getImageItems(
  clipboardData: DataTransfer | null | undefined,
): ImageItems {
  const items = Array.from(clipboardData?.items ?? []);
  const imageItems: File[] = [];

  for (const item of items) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const image = item.getAsFile();
    if (image) {
      imageItems.push(image);
    }
  }

  const text = clipboardData?.getData("text/plain") ?? "";

  return {
    imageItems,
    hasText: text.length > 0 ? true : false,
  };
}

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
 * Base interface for suggestion items (resources and prompts).
 */
interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

/**
 * Represents a resource item that appears in the "@" mention dropdown.
 * Resources are referenced by ID/URI and appear as visual mention nodes in the editor.
 */
export interface ResourceItem extends SuggestionItem {
  componentData?: unknown;
}

/**
 * Represents a prompt item that appears in the "/" command dropdown.
 * Prompts contain text that gets inserted into the editor.
 */
export interface PromptItem extends SuggestionItem {
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
  /** Called when resource search query changes (for "@" mentions) - parent should update `resources` prop */
  onSearchResources: (query: string) => void;
  /** Current list of resources to show in the "@" suggestion menu (controlled) */
  resources: ResourceItem[];
  /** Called when prompt search query changes (for "/" commands) - parent should update `prompts` prop */
  onSearchPrompts: (query: string) => void;
  /** Current list of prompts to show in the "/" suggestion menu (controlled) */
  prompts: PromptItem[];
  /** Called when a resource is selected from the "@" menu */
  onResourceSelect: (item: ResourceItem) => void;
  /** Called when a prompt is selected from the "/" menu */
  onPromptSelect: (item: PromptItem) => void;
}

/**
 * State for a suggestion popover.
 */
interface SuggestionState<T extends SuggestionItem> {
  isOpen: boolean;
  items: T[];
  selectedIndex: number;
  position: { top: number; left: number; lineHeight: number } | null;
  command: ((item: T) => void) | null;
}

/**
 * Ref value for accessing suggestion state from TipTap callbacks.
 */
interface SuggestionRef<T extends SuggestionItem> {
  state: SuggestionState<T>;
  setState: (update: Partial<SuggestionState<T>>) => void;
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
 * Props for the generic suggestion popover.
 */
interface SuggestionPopoverProps<T extends SuggestionItem> {
  state: SuggestionState<T>;
  onClose: () => void;
  defaultIcon: React.ReactNode;
  emptyMessage: string;
  /** Whether to use monospace font for the secondary text (id) */
  monoSecondary?: boolean;
}

/**
 * Generic popover component for suggestions (@resources and /prompts).
 */
function SuggestionPopover<T extends SuggestionItem>({
  state,
  onClose,
  defaultIcon,
  emptyMessage,
  monoSecondary = false,
}: SuggestionPopoverProps<T>) {
  if (!state.isOpen || !state.position) return null;

  const sideOffset = state.position.lineHeight + 4;

  return (
    <Popover.Root
      open={state.isOpen}
      onOpenChange={(open) => !open && onClose()}
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
          onClose();
        }}
      >
        {state.items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 p-1">
            {state.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === state.selectedIndex &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => state.command?.(item)}
              >
                {item.icon ?? defaultIcon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground truncate",
                      monoSecondary && "font-mono",
                    )}
                  >
                    {item.id}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}

/**
 * Internal helper to check if a mention exists in a raw TipTap Editor.
 */
function checkMentionExists(editor: Editor, label: string): boolean {
  if (!editor.state?.doc) return false;
  let exists = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        exists = true;
        return false;
      }
    }
    return true;
  });
  return exists;
}

/**
 * Creates the resource mention configuration for TipTap Mention extension.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
function createResourceMentionConfig(
  onSearchChange: (query: string) => void,
  onSelect: (item: ResourceItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<ResourceItem>>,
): Omit<SuggestionOptions, "editor"> {
  return {
    char: "@",
    items: ({ query }) => {
      onSearchChange(query);
      return [];
    },

    render: () => {
      const createWrapCommand =
        (
          editor: Editor,
          tiptapCommand: (attrs: { id: string; label: string }) => void,
        ) =>
        (item: ResourceItem) => {
          if (checkMentionExists(editor, item.name)) return;
          tiptapCommand({ id: item.id, label: item.name });
          onSelect(item);
        };

      return {
        onStart: (props) => {
          stateRef.current.setState({
            isOpen: true,
            selectedIndex: 0,
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
          });
        },
        onUpdate: (props) => {
          stateRef.current.setState({
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
            selectedIndex: 0,
          });
        },
        onKeyDown: ({ event }) => {
          const { state, setState } = stateRef.current;
          if (!state.isOpen) return false;

          const handlers: Record<string, () => boolean> = {
            ArrowUp: () => {
              if (state.items.length === 0) return false;
              setState({
                selectedIndex:
                  (state.selectedIndex - 1 + state.items.length) %
                  state.items.length,
              });
              return true;
            },
            ArrowDown: () => {
              if (state.items.length === 0) return false;
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
          stateRef.current.setState({ isOpen: false });
        },
      };
    },
  };
}

/**
 * Creates a custom TipTap extension for prompt commands using the Suggestion plugin.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
function createPromptCommandExtension(
  onSearchChange: (query: string) => void,
  onSelect: (item: PromptItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<PromptItem>>,
) {
  return Extension.create({
    name: "promptCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          items: ({ query, editor }) => {
            // Only show prompts when editor is empty (except for the "/" and query)
            const editorValue = editor.getText().replace("/", "").trim();
            if (editorValue.length > 0) {
              stateRef.current.setState({ isOpen: false });
              return [];
            }
            // Trigger search - actual items come from props via stateRef
            onSearchChange(query);
            return [];
          },
          render: () => {
            // Store command creator that captures editor context
            let createCommand: ((item: PromptItem) => void) | null = null;

            return {
              onStart: (props) => {
                createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  isOpen: true,
                  selectedIndex: 0,
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                });
              },
              onUpdate: (props) => {
                createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                  selectedIndex: 0,
                });
              },
              onKeyDown: ({ event }) => {
                const { state, setState } = stateRef.current;
                if (!state.isOpen) return false;

                const handlers: Record<string, () => boolean> = {
                  ArrowUp: () => {
                    if (state.items.length === 0) return false;
                    setState({
                      selectedIndex:
                        (state.selectedIndex - 1 + state.items.length) %
                        state.items.length,
                    });
                    return true;
                  },
                  ArrowDown: () => {
                    if (state.items.length === 0) return false;
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
                stateRef.current.setState({ isOpen: false });
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
      text += `@${id}`;
      if (label && id) {
        resourceNames[id] = label;
      }
    } else if (node.type.name === "hardBreak") {
      text += "\n";
    } else if (node.isText) {
      text += node.text;
    }
    return true;
  });

  return { text, resourceNames };
}

/**
 * Hook to create suggestion state with a ref for TipTap access.
 */
function useSuggestionState<T extends SuggestionItem>(
  externalItems?: T[],
): [SuggestionState<T>, React.MutableRefObject<SuggestionRef<T>>] {
  const [state, setStateInternal] = useState<SuggestionState<T>>({
    isOpen: false,
    items: externalItems ?? [],
    selectedIndex: 0,
    position: null,
    command: null,
  });

  const setState = React.useCallback((update: Partial<SuggestionState<T>>) => {
    setStateInternal((prev) => ({ ...prev, ...update }));
  }, []);

  const stateRef = React.useRef<SuggestionRef<T>>({ state, setState });

  // Keep ref in sync
  React.useEffect(() => {
    stateRef.current = { state, setState };
  }, [state, setState]);

  // Sync external items when provided
  React.useEffect(() => {
    if (externalItems !== undefined) {
      setStateInternal((prev) => {
        if (prev.items === externalItems) {
          return prev;
        }

        const previousMaxIndex = Math.max(prev.items.length - 1, 0);
        const safePrevIndex = Math.min(
          Math.max(prev.selectedIndex, 0),
          previousMaxIndex,
        );

        const selectedItem = prev.items[safePrevIndex];
        const matchedIndex = selectedItem
          ? externalItems.findIndex((item) => item.id === selectedItem.id)
          : -1;

        const maxIndex = Math.max(externalItems.length - 1, 0);
        const nextSelectedIndex =
          matchedIndex >= 0 ? matchedIndex : Math.min(safePrevIndex, maxIndex);

        return {
          ...prev,
          items: externalItems,
          selectedIndex: nextSelectedIndex,
        };
      });
    }
  }, [externalItems]);

  return [state, stateRef];
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
      resources,
      onSearchPrompts,
      prompts,
      onResourceSelect,
      onPromptSelect,
    },
    ref,
  ) => {
    // Suggestion states with refs for TipTap access
    const [resourceState, resourceRef] =
      useSuggestionState<ResourceItem>(resources);
    const [promptState, promptRef] = useSuggestionState<PromptItem>(prompts);

    // Consolidated ref for callbacks that TipTap needs to access
    const callbacksRef = React.useRef({
      onSearchResources,
      onResourceSelect,
      onSearchPrompts,
      onPromptSelect,
    });

    React.useEffect(() => {
      callbacksRef.current = {
        onSearchResources,
        onResourceSelect,
        onSearchPrompts,
        onPromptSelect,
      };
    }, [onSearchResources, onResourceSelect, onSearchPrompts, onPromptSelect]);

    // Stable callbacks for TipTap
    const stableSearchResources = React.useCallback(
      (query: string) => callbacksRef.current.onSearchResources(query),
      [],
    );

    const stableSearchPrompts = React.useCallback(
      (query: string) => callbacksRef.current.onSearchPrompts(query),
      [],
    );

    const handleResourceSelect = React.useCallback(
      (item: ResourceItem) => callbacksRef.current.onResourceSelect(item),
      [],
    );

    const handlePromptSelect = React.useCallback(
      (item: PromptItem) => callbacksRef.current.onPromptSelect(item),
      [],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim()) {
          e.preventDefault();
          void onSubmit(e as React.FormEvent);
          return;
        }
        onKeyDown?.(e);
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
        Mention.configure({
          HTMLAttributes: {
            class:
              "mention resource inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          },
          suggestion: createResourceMentionConfig(
            stableSearchResources,
            handleResourceSelect,
            resourceRef,
          ),
          renderLabel: ({ node }) => `@${(node.attrs.label as string) ?? ""}`,
        }),
        createPromptCommandExtension(
          stableSearchPrompts,
          handlePromptSelect,
          promptRef,
        ),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const { text, resourceNames } = getTextWithResourceURIs(editor);
        if (text !== value) {
          onChange(text);
        }
        if (onResourceNamesChange) {
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
          const { imageItems, hasText } = getImageItems(event.clipboardData);

          if (imageItems.length === 0) return false;

          if (!hasText) {
            event.preventDefault();
          }

          void (async () => {
            for (const item of imageItems) {
              try {
                await onAddImage(item);
              } catch (error) {
                console.error("Failed to add pasted image:", error);
              }
            }
          })();

          return !hasText;
        },
        handleKeyDown: (_view, event) => {
          const anyMenuOpen = resourceState.isOpen || promptState.isOpen;

          if (anyMenuOpen) return false;

          if (event.key === "Enter" && !event.shiftKey && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            handleKeyDown(reactEvent);
            return reactEvent.defaultPrevented;
          }

          return false;
        },
      },
    });

    useImperativeHandle(ref, () => {
      if (!editor) {
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
        getTextWithResourceURIs: () => getTextWithResourceURIs(editor),
        hasMention: (id: string) => {
          if (!editor.state?.doc) return false;
          let exists = false;
          editor.state.doc.descendants((node) => {
            if (node.type.name === "mention") {
              const mentionId = node.attrs.id as string;
              if (mentionId === id) {
                exists = true;
                return false;
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

    const lastSyncedValueRef = React.useRef<string>(value);

    React.useEffect(() => {
      if (!editor) return;

      const { text: currentText } = getTextWithResourceURIs(editor);

      if (value !== currentText && value !== lastSyncedValueRef.current) {
        editor.commands.setContent(value);
        lastSyncedValueRef.current = value;
      } else if (value === currentText) {
        lastSyncedValueRef.current = value;
      }

      editor.setEditable(!disabled);
    }, [editor, value, disabled]);

    return (
      <div className="w-full">
        <SuggestionPopover
          state={resourceState}
          onClose={() => resourceRef.current.setState({ isOpen: false })}
          defaultIcon={<Cuboid className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No results found"
          monoSecondary
        />
        <SuggestionPopover
          state={promptState}
          onClose={() => promptRef.current.setState({ isOpen: false })}
          defaultIcon={<FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No prompts found"
        />
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";
