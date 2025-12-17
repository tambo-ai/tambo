import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  TamboContextAttachmentProvider,
  useTamboContextAttachment,
} from "./tambo-context-attachment-provider";

/**
 * Test suite for TamboContextAttachmentProvider
 *
 * Tests the context attachment feature which allows:
 * - Visual context badges above message input
 * - Custom suggestions that override auto-generated ones
 */
describe("TamboContextAttachmentProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Base wrapper with TamboContextAttachmentProvider
   * @returns A React component that wraps children with the provider
   */
  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboContextAttachmentProvider>
        {children}
      </TamboContextAttachmentProvider>
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
