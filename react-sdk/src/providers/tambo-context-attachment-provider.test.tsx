import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  TamboContextAttachmentProvider,
  useTamboContextAttachment,
} from "./tambo-context-attachment-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

// Mock the context helpers provider
jest.mock("./tambo-context-helpers-provider");

const mockAddContextHelper = jest.fn();
const mockRemoveContextHelper = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useTamboContextHelpers as jest.Mock).mockReturnValue({
    addContextHelper: mockAddContextHelper,
    removeContextHelper: mockRemoveContextHelper,
  });
});

/**
 * Test suite for TamboContextAttachmentProvider
 *
 * Tests the context attachment feature which allows:
 * - Adding context attachments that will be sent with the next message
 * - Automatic registration/deregistration of context helpers
 */
describe("TamboContextAttachmentProvider", () => {
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
     * Should add a context attachment and register a context helper
     */
    it("should add a context attachment", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let attachment: ReturnType<typeof result.current.addContextAttachment>;
      act(() => {
        attachment = result.current.addContextAttachment(
          "selectedFile",
          "Button.tsx",
          "file",
        );
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0]).toMatchObject({
        displayName: "Button.tsx",
        context: "selectedFile",
        type: "file",
      });
      expect(result.current.attachments[0].id).toBeDefined();
      expect(attachment!.id).toBe(result.current.attachments[0].id);

      // Should register context helper
      expect(mockAddContextHelper).toHaveBeenCalledWith(
        attachment!.id,
        expect.any(Function),
      );
      // Verify the helper function returns the context value
      const helperFn = mockAddContextHelper.mock.calls[0][1];
      expect(helperFn()).toBe("selectedFile");
    });

    /**
     * Should add a context attachment without displayName
     */
    it("should add a context attachment without displayName", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let attachment: ReturnType<typeof result.current.addContextAttachment>;
      act(() => {
        attachment = result.current.addContextAttachment("selectedFile");
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0]).toMatchObject({
        context: "selectedFile",
      });
      expect(result.current.attachments[0].displayName).toBeUndefined();
      expect(attachment!.id).toBe(result.current.attachments[0].id);
    });

    /**
     * Should add multiple different context attachments
     */
    it("should add multiple context attachments", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment("file1", "Button.tsx", "file");
        result.current.addContextAttachment("file2", "Card.tsx", "file");
      });

      expect(result.current.attachments).toHaveLength(2);
      expect(result.current.attachments[0].displayName).toBe("Button.tsx");
      expect(result.current.attachments[1].displayName).toBe("Card.tsx");
      expect(mockAddContextHelper).toHaveBeenCalledTimes(2);
    });

    /**
     * Should allow multiple attachments with the same context value
     */
    it("should allow multiple attachments with same context value", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment(
          "selectedFile",
          "Button.tsx",
          "file",
        );
        result.current.addContextAttachment("selectedFile", "Card.tsx", "file");
      });

      expect(result.current.attachments).toHaveLength(2);
      expect(mockAddContextHelper).toHaveBeenCalledTimes(2);
    });

    /**
     * Should support optional type property
     */
    it("should support optional type property", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment("file1", "Button.tsx", "file");
        result.current.addContextAttachment("page1", "Dashboard", "page");
      });

      expect(result.current.attachments[0].type).toBe("file");
      expect(result.current.attachments[1].type).toBe("page");
    });
  });

  describe("Removing Context Attachments", () => {
    /**
     * Should remove a specific context attachment by ID and deregister helper
     */
    it("should remove context attachment by ID", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let attachmentId = "";
      act(() => {
        const attachment = result.current.addContextAttachment(
          "selectedFile",
          "Button.tsx",
        );
        attachmentId = attachment.id;
      });

      expect(result.current.attachments).toHaveLength(1);

      act(() => {
        result.current.removeContextAttachment(attachmentId);
      });

      expect(result.current.attachments).toHaveLength(0);
      expect(mockRemoveContextHelper).toHaveBeenCalledWith(attachmentId);
    });

    /**
     * Should only remove the specified attachment when multiple exist
     */
    it("should only remove specified attachment", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let firstId = "";
      act(() => {
        const first = result.current.addContextAttachment("file1", "First.tsx");
        result.current.addContextAttachment("file2", "Second.tsx");
        firstId = first.id;
      });

      expect(result.current.attachments).toHaveLength(2);

      act(() => {
        result.current.removeContextAttachment(firstId);
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].displayName).toBe("Second.tsx");
      expect(mockRemoveContextHelper).toHaveBeenCalledWith(firstId);
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

      expect(mockRemoveContextHelper).toHaveBeenCalledWith("non-existent-id");
    });
  });

  describe("Clearing All Context Attachments", () => {
    /**
     * Should clear all context attachments and deregister all helpers
     */
    it("should clear all context attachments", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let ids: string[] = [];
      act(() => {
        const first = result.current.addContextAttachment("file1", "First.tsx");
        const second = result.current.addContextAttachment(
          "file2",
          "Second.tsx",
        );
        const third = result.current.addContextAttachment("file3", "Third.tsx");
        ids = [first.id, second.id, third.id];
      });

      expect(result.current.attachments).toHaveLength(3);

      act(() => {
        result.current.clearContextAttachments();
      });

      expect(result.current.attachments).toHaveLength(0);
      // Should remove all helpers
      expect(mockRemoveContextHelper).toHaveBeenCalledTimes(3);
      for (const id of ids) {
        expect(mockRemoveContextHelper).toHaveBeenCalledWith(id);
      }
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
      expect(mockRemoveContextHelper).not.toHaveBeenCalled();
    });
  });
});
