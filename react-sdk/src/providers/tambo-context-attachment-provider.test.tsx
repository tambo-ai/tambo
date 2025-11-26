import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import { act, renderHook, waitFor } from "@testing-library/react";
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
 * - Automatic context helper registration/unregistration
 * - Custom suggestions that override auto-generated ones
 * - Dynamic context data customization via getContextHelperData
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

  describe("Context Helpers Integration", () => {
    /**
     * Should automatically register context helpers when attachments are added
     */
    it("should register context helpers for attachments", async () => {
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

      // Wait for effect to run
      await waitFor(async () => {
        const contexts = await result.current.helpers.getAdditionalContext();
        expect(contexts.length).toBeGreaterThan(0);
      });

      const contexts = await result.current.helpers.getAdditionalContext();
      const attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );

      expect(attachmentContext).toBeDefined();
      expect(attachmentContext?.context).toHaveProperty("selectedComponent");
    });

    /**
     * Should unregister context helpers when attachments are removed
     */
    it("should unregister context helpers when attachments are removed", async () => {
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

      // Wait for context helper to be registered
      await waitFor(async () => {
        const contexts = await result.current.helpers.getAdditionalContext();
        expect(contexts.length).toBeGreaterThan(0);
      });

      const initialContexts =
        await result.current.helpers.getAdditionalContext();
      const initialCount = initialContexts.length;
      const attachmentId = result.current.attachment.attachments[0].id;

      // Remove attachment
      act(() => {
        result.current.attachment.removeContextAttachment(attachmentId);
      });

      // Wait for context helper to be unregistered
      await waitFor(async () => {
        const contexts = await result.current.helpers.getAdditionalContext();
        expect(contexts.length).toBeLessThan(initialCount);
      });
    });

    /**
     * Should use default context data structure when no custom function provided
     */
    it("should use default context data structure", async () => {
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

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx", type: "component" },
        });
      });

      await waitFor(async () => {
        const contexts = await result.current.helpers.getAdditionalContext();
        expect(contexts.length).toBeGreaterThan(0);
      });

      const contexts = await result.current.helpers.getAdditionalContext();
      const attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );

      expect(attachmentContext?.context).toMatchObject({
        selectedComponent: {
          name: "Button.tsx",
          instruction: expect.stringContaining("Tambo interactable component"),
          filePath: "/src/Button.tsx",
          type: "component",
        },
      });
    });

    /**
     * Should use custom getContextHelperData function when provided
     */
    it("should use custom getContextHelperData function", async () => {
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
          helpers: useTamboContextHelpers(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
          metadata: { filePath: "/src/Button.tsx" },
        });
      });

      // Wait for context helper to be registered and called
      await waitFor(
        async () => {
          const contexts = await result.current.helpers.getAdditionalContext();
          expect(contexts.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );

      expect(customGetContextHelperData).toHaveBeenCalled();

      const contexts = await result.current.helpers.getAdditionalContext();
      const attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );

      expect(attachmentContext?.context).toEqual({
        selectedFile: {
          name: "Button.tsx",
          path: "/src/Button.tsx",
          customField: "custom value",
        },
      });
    });

    /**
     * Should update context helpers when getContextHelperData function changes
     * This tests the bug fix for stale closure issue
     */
    it("should update existing context helpers when getContextHelperData changes", async () => {
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
          helpers: useTamboContextHelpers(),
        }),
        { wrapper: TestWrapper },
      );

      // Add attachment with first version
      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      // Wait for context helper to be registered
      await waitFor(
        async () => {
          const contexts = await result.current.helpers.getAdditionalContext();
          expect(contexts.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );

      // Verify v1 context
      let contexts = await result.current.helpers.getAdditionalContext();
      let attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );
      expect(attachmentContext?.context).toMatchObject({ version: "v1" });

      // Change the version which will trigger a new getContextHelperData function
      act(() => {
        (TestWrapper as any).setVersion("v2");
      });

      // Wait for context to update to v2
      await waitFor(
        async () => {
          const contexts = await result.current.helpers.getAdditionalContext();
          const context = contexts.find((c) =>
            c.name.includes(result.current.attachment.attachments[0].id),
          );
          return context?.context.version === "v2";
        },
        { timeout: 2000 },
      );

      // Verify v2 context - should be updated, not stale
      contexts = await result.current.helpers.getAdditionalContext();
      attachmentContext = contexts.find((c) =>
        c.name.includes(result.current.attachment.attachments[0].id),
      );
      expect(attachmentContext?.context).toMatchObject({ version: "v2" });
    });

    /**
     * Should handle errors in getContextHelperData gracefully
     */
    it("should handle errors in getContextHelperData gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

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
          helpers: useTamboContextHelpers(),
        }),
        { wrapper },
      );

      act(() => {
        result.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      // Wait for effect to run and try to call the function
      await waitFor(
        () => {
          expect(result.current.attachment.attachments.length).toBeGreaterThan(
            0,
          );
        },
        { timeout: 2000 },
      );

      // Try to get contexts, which will trigger the error
      await result.current.helpers.getAdditionalContext();

      expect(errorGetData).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
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

  describe("Cleanup", () => {
    /**
     * Should cleanup context helpers on unmount
     */
    it("should cleanup context helpers on unmount", async () => {
      // Use a shared provider wrapper so context helpers persist
      const SharedWrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider>{children}</TamboContextHelpersProvider>
      );

      // First render with attachment provider
      const { result: attachmentResult, unmount } = renderHook(
        () => ({
          attachment: useTamboContextAttachment(),
          helpers: useTamboContextHelpers(),
        }),
        {
          wrapper: ({ children }) => (
            <SharedWrapper>
              <TamboContextAttachmentProvider>
                {children}
              </TamboContextAttachmentProvider>
            </SharedWrapper>
          ),
        },
      );

      // Add attachment
      act(() => {
        attachmentResult.current.attachment.addContextAttachment({
          name: "Button.tsx",
        });
      });

      const attachmentId =
        attachmentResult.current.attachment.attachments[0].id;

      // Wait for context helper to be registered
      await waitFor(async () => {
        const contexts =
          await attachmentResult.current.helpers.getAdditionalContext();
        const hasContext = contexts.some((c) => c.name.includes(attachmentId));
        expect(hasContext).toBe(true);
      });

      // Unmount the attachment provider
      unmount();

      // Create new hook to check cleanup
      const { result: helpersResult } = renderHook(
        () => useTamboContextHelpers(),
        { wrapper: SharedWrapper },
      );

      // Wait a bit for cleanup effect to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      const contexts = await helpersResult.current.getAdditionalContext();

      // Should not contain the attachment context after unmount
      const hasAttachmentContext = contexts.some((c) =>
        c.name.includes(attachmentId),
      );
      expect(hasAttachmentContext).toBe(false);
    });
  });
});
