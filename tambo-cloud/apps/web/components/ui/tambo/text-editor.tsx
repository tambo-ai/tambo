"use client";

import { cn } from "@/lib/utils";
import {
  useCurrentInteractablesSnapshot,
  useTamboContextAttachment,
  useTamboThreadInput,
} from "@tambo-ai/react";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import {
  EditorContent,
  ReactRenderer,
  useEditor,
  type Editor,
} from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { Cuboid } from "lucide-react";
import * as React from "react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

/**
 * Represents a resource item that appears in a command dropdown (e.g., "@" mentions or "/" commands).
 * Used to represent components, actions, or other entities that can be triggered.
 * Interactables are one type of resource.
 */
export interface ResourceItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

/**
 * Configuration for a command trigger (e.g., "@" or "/").
 * Note: TipTap's Mention only supports "@". For "/", create a custom extension using Suggestion plugin with `char: "/"`.
 * Use `createResourceItemConfig` from this file. See: https://tiptap.dev/docs/editor/api/utilities/suggestion
 */
export interface CommandConfig {
  /** The character that triggers this command (e.g., "@" or "/") */
  triggerChar: string;
  /**
   * Items to show in the dropdown when user types the trigger.
   * Can be either a static array or an async function that fetches items based on the query.
   * The query parameter is the text after the trigger character (e.g., "@foo" → query is "foo").
   */
  items: ResourceItem[] | ((query: string) => Promise<ResourceItem[]>);
  /** Callback when a user selects an item from the dropdown */
  onSelect?: (item: ResourceItem) => void;
  /**
   * How to render the command label in the editor (e.g., "@name" or "/name").
   * The typed text appears in `node.attrs.label` (e.g., if user types "@foo", then `node.attrs.label` is "foo").
   * This function should return the string to display in the editor for this mention/command.
   */
  renderLabel: (props: {
    options: unknown;
    node: { attrs: Record<string, unknown> };
    suggestion: unknown;
  }) => string;
  /** HTML attributes to apply to the command node */
  HTMLAttributes?: Record<string, string>;
  /** Optional ref to track if the menu is open (for preventing Enter key conflicts) */
  isMenuOpenRef?: React.MutableRefObject<boolean>;
}

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
  commands?: CommandConfig[];
  /** Optional submit handler for Tambo-specific Enter key behavior */
  onSubmit?: (e: React.FormEvent) => Promise<void>;
}

/**
 * Ref interface for the resource item list component.
 * Allows parent components to handle keyboard events.
 */
interface ResourceItemListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Dropdown component that displays resource items.
 *
 * When the user types "@" in the editor, this component renders a list
 * of resource items with keyboard navigation (arrow keys, Enter, Escape).
 *
 */
const ResourceItemList = forwardRef<
  ResourceItemListRef,
  { items: ResourceItem[]; command: (item: ResourceItem) => void }
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  useEffect(() => setSelectedIndex(0), [items]);

  const navigate = (delta: number) =>
    setSelectedIndex((i) => (i + delta + items.length) % items.length);

  // Expose keyboard handler to parent
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      const handlers: Record<string, () => void> = {
        ArrowUp: () => navigate(-1),
        ArrowDown: () => navigate(1),
        Enter: () => items[selectedIndex] && command(items[selectedIndex]),
      };
      const handler = handlers[event.key];
      if (handler) {
        handler();
        return true;
      }
      return false;
    },
  }));

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
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            index === selectedIndex && "bg-accent text-accent-foreground",
          )}
          onClick={() => command(item)}
        >
          {item.icon ?? <Cuboid className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
});
ResourceItemList.displayName = "ResourceItemList";

/**
 * Checks if a mention with the given label already exists in the editor.
 * Used to prevent duplicate mentions when inserting via @ command or EditableHint.
 *
 * @param editor - The TipTap editor instance
 * @param label - The mention label to check for
 * @returns true if a mention with the given label exists, false otherwise
 */
export function hasExistingMention(editor: Editor, label: string): boolean {
  let hasMention = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        hasMention = true;
        return false; // Stop traversing
      }
    }
    return true;
  });
  return hasMention;
}

/**
 * Creates a popup handler for the resource item dropdown using tippy.js.
 */
function createResourceItemPopup() {
  let itemListComponent: ReactRenderer<ResourceItemListRef> | undefined;
  let tippyPopup: TippyInstance | undefined;

  return {
    /**
     * Called when the user starts typing "@" and resource items should appear.
     * Creates the React component and tippy popup.
     */
    onStart(props: {
      items: ResourceItem[];
      command: (item: ResourceItem) => void;
      editor: Editor;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      itemListComponent = new ReactRenderer(ResourceItemList, {
        props: { items: props.items, command: props.command },
        editor: props.editor,
      });

      if (!props.clientRect) return;

      tippyPopup = tippy("body", {
        getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
        appendTo: () => document.body,
        content: itemListComponent.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        maxWidth: "24rem",
        theme: "light-border",
      })[0];
    },

    /**
     * Called when resource items change (user continues typing after "@").
     * Updates the resource item list and repositions the popup.
     */
    onUpdate(props: {
      items: ResourceItem[];
      command: (item: ResourceItem) => void;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      itemListComponent?.updateProps({
        items: props.items,
        command: props.command,
      });
      if (props.clientRect && tippyPopup) {
        tippyPopup.setProps({
          getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
        });
      }
    },

    /**
     * Handles keyboard events in the resource item dropdown.
     * - Escape: closes the popup
     * - Arrow keys/Enter: delegated to the resource item list component
     */
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === "Escape") {
        tippyPopup?.hide();
        return true;
      }
      const handled = itemListComponent?.ref?.onKeyDown({ event }) ?? false;
      if (handled) event.preventDefault();
      return handled;
    },

    /**
     * Called when the resource item popup should be closed.
     * Cleans up the React component and tippy popup.
     */
    onExit() {
      tippyPopup?.destroy();
      itemListComponent?.destroy();
    },
  };
}

/**
 * Creates the resource item configuration for TipTap Mention extension.
 * Filters resource items as user types and handles dropdown lifecycle.
 * Supports both static arrays and async fetching.
 */
function createResourceItemConfig(
  items: ResourceItem[] | ((query: string) => Promise<ResourceItem[]>),
  onSelect?: (item: ResourceItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    items: async ({ query }) => {
      // If items is a function, call it with the query
      if (typeof items === "function") {
        return await items(query);
      }
      // Otherwise, filter the static array
      return items.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
    },

    /**
     * Returns handlers for managing the resource item popup lifecycle.
     * Called once when the mention system initializes (when editor is created).
     */
    render: () => {
      const popupHandlers = createResourceItemPopup();

      /**
       * Creates a wrapped command that checks for duplicates before inserting.
       * Must be created inside onStart/onUpdate where editor is available.
       */
      const createWrapCommand =
        (editor: Editor) =>
        (tiptapCommand: (attrs: { id: string; label: string }) => void) =>
        (item: ResourceItem) => {
          // Check if mention already exists in the editor
          if (hasExistingMention(editor, item.name)) {
            // Don't insert duplicate mention
            return;
          }

          // Insert the command into the editor (e.g., "@ComponentName")
          tiptapCommand({ id: item.id, label: item.name });
          // Run custom logic (e.g., add context attachment, insert table, etc.)
          onSelect?.(item);
        };

      return {
        /**
         * Called when user starts typing the trigger character (e.g., "@").
         * Shows the resource item dropdown.
         */
        onStart: (props) => {
          if (isMenuOpenRef) isMenuOpenRef.current = true;
          popupHandlers.onStart({
            items: props.items,
            editor: props.editor,
            clientRect: props.clientRect,
            command: createWrapCommand(props.editor)(props.command),
          });
        },

        /**
         * Called as user continues typing after the trigger (e.g., "@jo" -> "@john").
         * Updates the filtered resource items in the dropdown.
         */
        onUpdate: (props) => {
          popupHandlers.onUpdate({
            items: props.items,
            clientRect: props.clientRect,
            command: createWrapCommand(props.editor)(props.command),
          });
        },

        /**
         * Handles keyboard events in the resource item dropdown.
         * - ArrowUp/ArrowDown: Navigate through resource items
         * - Enter: Select current resource item
         * - Escape: Close dropdown
         */
        onKeyDown: popupHandlers.onKeyDown,

        /**
         * Called when the resource item dropdown should close.
         * Cleans up the popup and updates the menu state.
         */
        onExit: () => {
          // Delay setting menu to closed to give our handleKeyDown a chance to see it was open
          // This prevents the form from submitting when Enter is used to select an item
          setTimeout(() => {
            if (isMenuOpenRef) isMenuOpenRef.current = false;
          }, 100);
          popupHandlers.onExit();
        },
      };
    },
  };
}

/**
 * Text editor component with command support (e.g., "@" mentions).
 */
export const TextEditor = React.forwardRef<HTMLDivElement, TextEditorProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      editorRef,
      commands: providedCommands = [],
      onSubmit,
    },
    ref,
  ) => {
    // Use Tambo-specific hooks - must be called unconditionally per React rules
    // These hooks will throw if not in Tambo context, which is expected when onSubmit is provided
    const tamboThreadInput = useTamboThreadInput();
    const tamboContextAttachment = useTamboContextAttachment();
    const interactables = useCurrentInteractablesSnapshot();

    // Ref to access the current interactables without capturing them in a closure
    const interactablesRef = React.useRef(interactables);
    useEffect(() => {
      interactablesRef.current = interactables;
    }, [interactables]);

    const tamboCommands = React.useMemo((): CommandConfig[] => {
      if (!onSubmit) return [];

      // Function to get the resource items for the @ mention dropdown
      const getResourceItems = async (
        query: string,
      ): Promise<ResourceItem[]> => {
        // Get the current interactables via ref to get the current value
        const resourceItems = interactablesRef.current.map((component) => ({
          id: component.id,
          name: component.name,
          icon: React.createElement(Cuboid, { className: "w-4 h-4" }),
          componentData: component,
        }));

        // Filter the resource items by query
        return resourceItems.filter((item) =>
          item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        );
      };

      // Create the @ command
      return [
        {
          triggerChar: "@",
          items: getResourceItems,
          onSelect: (item: ResourceItem) => {
            // When a mention is selected, add it as a context attachment
            // This will appear as a badge above the input
            tamboContextAttachment.addContextAttachment({ name: item.name });
          },
          renderLabel: ({
            node,
          }: {
            node: { attrs: Record<string, unknown> };
          }) => `@${(node.attrs.label as string) ?? ""}`,
          HTMLAttributes: { class: "mention" },
        },
      ];
    }, [onSubmit, tamboContextAttachment]);

    // Handle image paste from clipboard when onSubmit is provided
    React.useEffect(() => {
      if (!onSubmit) return;

      const handlePaste = async (e: Event) => {
        const clipboardEvent = e as ClipboardEvent;
        const items = Array.from(clipboardEvent.clipboardData?.items ?? []);
        const imageItems = items.filter((item) =>
          item.type.startsWith("image/"),
        );

        if (imageItems.length === 0) return;

        const hasText = clipboardEvent.clipboardData?.getData("text/plain");
        if (!hasText) e.preventDefault();

        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            try {
              file[IS_PASTED_IMAGE] = true;
              await tamboThreadInput.addImage(file);
            } catch (error) {
              console.error("Failed to add pasted image:", error);
            }
          }
        }
      };

      const editorElement = document.querySelector(
        '[data-slot="message-input-textarea"]',
      );
      editorElement?.addEventListener("paste", handlePaste as EventListener);
      return () =>
        editorElement?.removeEventListener(
          "paste",
          handlePaste as EventListener,
        );
    }, [onSubmit, tamboThreadInput]);

    // Merge provided commands with Tambo-specific commands
    const commands = React.useMemo(
      () => [...providedCommands, ...tamboCommands],
      [providedCommands, tamboCommands],
    );

    // Handle Enter key to submit message when onSubmit is provided
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent, editor: Editor) => {
        // Handle Tambo-specific Enter key behavior
        if (onSubmit && e.key === "Enter" && !e.shiftKey && value.trim()) {
          e.preventDefault();
          void onSubmit(e as React.FormEvent);
          return;
        }

        // Delegate to provided onKeyDown handler
        if (onKeyDown) {
          onKeyDown(e, editor);
        }
      },
      [onSubmit, value, onKeyDown],
    );
    // Initialize menu open refs for each command
    // Use a stable ref that persists across renders to track menu state
    const stableMenuOpenRef = React.useRef<boolean>(false);
    const commandRefs = React.useMemo(
      () =>
        commands.map((cmd) => ({
          isMenuOpenRef: cmd.isMenuOpenRef ?? stableMenuOpenRef,
        })),
      [commands],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({ placeholder }),
        ...commands.map((cmd, index) => {
          const ref = commandRefs[index];
          return Mention.configure({
            HTMLAttributes: cmd.HTMLAttributes ?? {},
            suggestion: createResourceItemConfig(
              cmd.items,
              cmd.onSelect,
              ref.isMenuOpenRef,
            ),
            renderLabel: cmd.renderLabel,
          });
        }),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => onChange(editor.getText()),
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
        handleKeyDown: (view, event) => {
          // Check if any command menu is open
          const anyMenuOpen = commandRefs.some(
            (ref) => ref.isMenuOpenRef.current,
          );

          // Prevent Enter from submitting form when selecting from any resource item menu
          if (event.key === "Enter" && !event.shiftKey && anyMenuOpen) {
            // Prevent the DOM event from propagating
            event.preventDefault();
            event.stopPropagation();
            // Return false to let the suggestion plugin handle the selection
            return false;
          }

          // Delegate to handleKeyDown (which handles both Tambo-specific and custom handlers)
          if (editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            handleKeyDown(reactEvent, editor);
            return reactEvent.defaultPrevented;
          }
          return false;
        },
      },
    });

    // Sync external value changes and disabled state with editor
    React.useEffect(() => {
      if (!editor) return;
      if (value !== editor.getText()) {
        editor.commands.setContent(value);
      }
      editor.setEditable(!disabled);
      if (editorRef) {
        editorRef.current = editor;
      }
    }, [editor, value, disabled, editorRef]);

    return (
      <div ref={ref} className="w-full">
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";

/**
 * Symbol for marking pasted images.
 * Using Symbol.for to create a global symbol that can be accessed across modules.
 * @internal
 */
const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

/**
 * Extend the File interface to include the IS_PASTED_IMAGE property.
 * This is a type-safe way to mark pasted images without using a broad index signature.
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}
