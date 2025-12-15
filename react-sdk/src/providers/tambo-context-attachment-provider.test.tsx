import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  TamboContextAttachmentProvider,
  useTamboContextAttachment,
  type ContextAttachment,
  type ContextHelperData,
} from "./tambo-context-attachment-provider";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "./tambo-context-helpers-provider";

/**
 * Test suite for TamboContextAttachmentProvider
 *
 * Tests the context attachment feature which allows:
 * - Visual context badges above message input
 * - Tracking which components are selected for interaction
 * - Custom suggestions that override auto-generated ones
 *
 * Note: Context attachments no longer create separate context helpers.
 * Instead, they mark components as selected (isSelectedForInteraction: true)
 * in the unified interactables context managed by TamboInteractableProvider.
 */
describe("TamboContextAttachmentProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Base wrapper with both TamboContextAttachmentProvider and TamboContextHelpersProvider
   * since context attachments need access to context helpers API
   * @param getContextHelperData - Optional custom function to get context helper data
   * @returns A React component that wraps children with the necessary providers
   */
  const createWrapper = (
    getContextHelperData?: (
      context: ContextAttachment,
    ) => Promise<ContextHelperData> | ContextHelperData,
  ) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboContextHelpersProvider>
        <TamboContextAttachmentProvider
          getContextHelperData={getContextHelperData}
        >
          {children}
        </TamboContextAttachmentProvider>
      </TamboContextHelpersProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  describe("Hook Access", () => {
    /**
     * Hook should provide all expected API functions when used within provider
     */
    it("should provide context attachment API functions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("attachments");
      expect(result.current).toHaveProperty("addContextAttachment");
      expect(result.current).toHaveProperty("removeContextAttachment");
      expect(result.current).toHaveProperty("clearContextAttachments");
      expect(result.current).toHaveProperty("customSuggestions");
      expect(result.current).toHaveProperty("setCustomSuggestions");
    });

    /**
     * Hook should throw error when used outside of provider
     */
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTamboContextAttachment());
      }).toThrow(
        "useTamboContextAttachment must be used within a TamboContextAttachmentProvider",
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Adding Context Attachments", () => {
    /**
     * Should add a context attachment with auto-generated ID
     */
    it("should add a context attachment", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx" },
        });
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0]).toMatchObject({
        name: "Button.tsx",
        metadata: { filePath: "/src/Button.tsx" },
      });
      expect(result.current.attachments[0].id).toBeDefined();
    });

    /**
     * Should add multiple different attachments
     */
    it("should add multiple context attachments", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          name: "Button.tsx",
        });
        result.current.addContextAttachment({
          name: "Card.tsx",
        });
      });

      expect(result.current.attachments).toHaveLength(2);
      expect(result.current.attachments[0].name).toBe("Button.tsx");
      expect(result.current.attachments[1].name).toBe("Card.tsx");
    });

    /**
     * Should prevent duplicates with the same name
     */
    it("should prevent duplicate attachments with same name", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          name: "Button.tsx",
        });
        result.current.addContextAttachment({
          name: "Button.tsx",
        });
      });

      expect(result.current.attachments).toHaveLength(1);
    });

    /**
     * Should support optional icon property
     */
    it("should support icon property", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const icon = <span>📄</span>;

      act(() => {
        result.current.addContextAttachment({
          name: "File.txt",
          icon,
        });
      });

      expect(result.current.attachments[0].icon).toBe(icon);
    });
  });

  describe("Removing Context Attachments", () => {
    /**
     * Should remove a specific attachment by ID
     */
    it("should remove context attachment by ID", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          name: "Button.tsx",
        });
      });

      expect(result.current.attachments).toHaveLength(1);
      const attachmentId = result.current.attachments[0].id;

      act(() => {
        result.current.removeContextAttachment(attachmentId);
      });

      expect(result.current.attachments).toHaveLength(0);
    });

    /**
     * Should only remove the specified attachment when multiple exist
     */
    it("should only remove specified attachment", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({ name: "First.tsx" });
        result.current.addContextAttachment({ name: "Second.tsx" });
      });

      expect(result.current.attachments).toHaveLength(2);
      const firstId = result.current.attachments[0].id;

      act(() => {
        result.current.removeContextAttachment(firstId);
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].name).toBe("Second.tsx");
    });

    /**
     * Should handle removing non-existent attachment gracefully
     */
    it("should handle removing non-existent attachment gracefully", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.removeContextAttachment("non-existent-id");
        });
      }).not.toThrow();
    });
  });

  describe("Clearing All Attachments", () => {
    /**
     * Should clear all attachments at once
     */
    it("should clear all context attachments", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({ name: "First.tsx" });
        result.current.addContextAttachment({ name: "Second.tsx" });
        result.current.addContextAttachment({ name: "Third.tsx" });
      });

      expect(result.current.attachments).toHaveLength(3);

      act(() => {
        result.current.clearContextAttachments();
      });

      expect(result.current.attachments).toHaveLength(0);
    });

    /**
     * Should handle clearing when no attachments exist
     */
    it("should handle clearing when no attachments exist", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.clearContextAttachments();
        });
      }).not.toThrow();

      expect(result.current.attachments).toHaveLength(0);
    });
  });

  describe("Context Attachments State Management", () => {
    /**
     * Context attachments no longer create separate context helpers.
     * They are now tracked as state and consumed by TamboInteractableProvider
     * to mark components as selected in the unified interactables context.
     */
    it("should track attachments without creating separate context helpers", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>
          <TamboContextAttachmentProvider>
            {children}
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
          helpers: useTamboContextHelpers(),
        }),
        { wrapper },
      );

      // Add attachment
      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx" },
        });
      });

      // Verify attachment is tracked
      expect(result.current.attachment.attachments).toHaveLength(1);
      expect(result.current.attachment.attachments[0].name).toBe("Button.tsx");

      // Verify no separate context helper was created for the attachment
      const contexts = await result.current.helpers.getAdditionalContext();
      const attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );
      expect(attachmentContext).toBeUndefined();
    });

    /**
     * Should remove attachments from state when removed
     */
    it("should remove attachments from state without affecting context helpers", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>
          <TamboContextAttachmentProvider>
            {children}
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
          helpers: useTamboContextHelpers(),
        }),
        { wrapper },
      );

      // Add attachment
      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      expect(result.current.attachment.attachments).toHaveLength(1);
      const attachmentId = result.current.attachment.attachments[0].id;

      // Remove attachment
      act(() => {
        result.current.attachment.removeContextAttachment(attachmentId);
      });

      // Verify attachment was removed from state
      expect(result.current.attachment.attachments).toHaveLength(0);
    });

    /**
     * Should preserve attachment metadata for use by other providers
     */
    it("should preserve attachment metadata", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>
          <TamboContextAttachmentProvider>
            {children}
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx", type: "component" },
        });
      });

      // Verify attachment metadata is preserved for consumption by other providers
      expect(result.current.attachment.attachments[0]).toMatchObject({
        name: "Button.tsx",
        metadata: { filePath: "/src/Button.tsx", type: "component" },
      });
    });

    /**
     * getContextHelperData prop is deprecated and no longer used
     */
    it("should accept getContextHelperData prop for backward compatibility but not use it", async () => {
      const customGetContextHelperData = jest.fn(
        async (context: ContextAttachment) => ({
          selectedFile: {
            name: context.name,
            path: context.metadata?.filePath,
            customField: "custom value",
          },
        }),
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>
          <TamboContextAttachmentProvider
            getContextHelperData={customGetContextHelperData}
          >
            {children}
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx" },
        });
      });

      // Verify the function is not called since it's deprecated
      expect(customGetContextHelperData).not.toHaveBeenCalled();

      // Verify attachment still works
      expect(result.current.attachment.attachments).toHaveLength(1);
    });

    /**
     * getContextHelperData prop changes have no effect since it's deprecated
     */
    it("should handle getContextHelperData prop changes gracefully", async () => {
      // Create a wrapper component with state to manage the function
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        const [version, setVersion] = React.useState("v1");

        const getContextHelperData = React.useCallback(
          async (context: ContextAttachment) => ({
            version,
            name: context.name,
          }),
          [version],
        );

        // Expose setVersion for the test
        (TestWrapper as any).setVersion = setVersion;

        return (
          <TamboContextHelpersProvider>
            <TamboContextAttachmentProvider
              getContextHelperData={getContextHelperData}
            >
              {children}
            </TamboContextAttachmentProvider>
          </TamboContextHelpersProvider>
        );
      };

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
        }),
        { wrapper: TestWrapper },
      );

      // Add attachment with first version
      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      // Verify attachment was added
      expect(result.current.attachment.attachments).toHaveLength(1);

      // Change the version which will trigger a new getContextHelperData function
      // but since it's deprecated, it should have no effect
      act(() => {
        (TestWrapper as any).setVersion("v2");
      });

      // Verify attachment state is still intact
      expect(result.current.attachment.attachments).toHaveLength(1);
      expect(result.current.attachment.attachments[0].name).toBe("Button.tsx");
    });

    /**
     * getContextHelperData errors have no effect since it's deprecated
     */
    it("should handle getContextHelperData prop gracefully even with errors", async () => {
      const errorGetData = jest.fn(async () => {
        throw new Error("Custom data error");
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>
          <TamboContextAttachmentProvider getContextHelperData={errorGetData}>
            {children}
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      // Verify attachment was added successfully despite the error function
      expect(result.current.attachment.attachments).toHaveLength(1);

      // Verify the error function was not called since it's deprecated
      expect(errorGetData).not.toHaveBeenCalled();
    });
  });

  describe("Custom Suggestions", () => {
    /**
     * Should start with null custom suggestions
     */
    it("should initialize with null custom suggestions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      expect(result.current.customSuggestions).toBeNull();
    });

    /**
     * Should set custom suggestions
     */
    it("should set custom suggestions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const suggestions: Suggestion[] = [
        {
          id: "1",
          title: "Edit component",
          detailedSuggestion: "Modify the Button component",
          messageId: "",
        },
        {
          id: "2",
          title: "Add feature",
          detailedSuggestion: "Add a new feature",
          messageId: "",
        },
      ];

      act(() => {
        result.current.setCustomSuggestions(suggestions);
      });

      expect(result.current.customSuggestions).toEqual(suggestions);
    });

    /**
     * Should clear custom suggestions by setting to null
     */
    it("should clear custom suggestions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const suggestions: Suggestion[] = [
        {
          id: "1",
          title: "Test",
          detailedSuggestion: "Test suggestion",
          messageId: "",
        },
      ];

      act(() => {
        result.current.setCustomSuggestions(suggestions);
      });

      expect(result.current.customSuggestions).toEqual(suggestions);

      act(() => {
        result.current.setCustomSuggestions(null);
      });

      expect(result.current.customSuggestions).toBeNull();
    });

    /**
     * Should update custom suggestions when changed
     */
    it("should update custom suggestions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const firstSuggestions: Suggestion[] = [
        {
          id: "1",
          title: "First",
          detailedSuggestion: "First suggestion",
          messageId: "",
        },
      ];

      const secondSuggestions: Suggestion[] = [
        {
          id: "2",
          title: "Second",
          detailedSuggestion: "Second suggestion",
          messageId: "",
        },
      ];

      act(() => {
        result.current.setCustomSuggestions(firstSuggestions);
      });

      expect(result.current.customSuggestions).toEqual(firstSuggestions);

      act(() => {
        result.current.setCustomSuggestions(secondSuggestions);
      });

      expect(result.current.customSuggestions).toEqual(secondSuggestions);
    });
  });

  describe("Combined Workflows", () => {
    /**
     * Should handle adding attachment and setting custom suggestions together
     */
    it("should handle attachment and custom suggestions together", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const suggestions: Suggestion[] = [
        {
          id: "1",
          title: "Edit file",
          detailedSuggestion: "Edit this file",
          messageId: "",
        },
      ];

      act(() => {
        result.current.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx" },
        });
        result.current.setCustomSuggestions(suggestions);
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.customSuggestions).toEqual(suggestions);
    });

    /**
     * Should clear suggestions when clearing attachments
     */
    it("should independently manage attachments and suggestions", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      const suggestions: Suggestion[] = [
        {
          id: "1",
          title: "Test",
          detailedSuggestion: "Test suggestion",
          messageId: "",
        },
      ];

      act(() => {
        result.current.addContextAttachment({ name: "File.tsx" });
        result.current.setCustomSuggestions(suggestions);
      });

      // Clear attachments
      act(() => {
        result.current.clearContextAttachments();
      });

      // Suggestions should remain
      expect(result.current.attachments).toHaveLength(0);
      expect(result.current.customSuggestions).toEqual(suggestions);

      // Can clear suggestions separately
      act(() => {
        result.current.setCustomSuggestions(null);
      });

      expect(result.current.customSuggestions).toBeNull();
    });
  });
});
