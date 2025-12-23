import { act, renderHook, waitFor } from "@testing-library/react";
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

const CONTEXT_ATTACHMENTS_HELPER_KEY = "contextAttachments";

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
     * Should add a context attachment and register/update the merged context helper
     */
    it("should add a context attachment", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let attachment: ReturnType<typeof result.current.addContextAttachment>;
      act(() => {
        attachment = result.current.addContextAttachment({
          context: "selectedFile",
          displayName: "Button.tsx",
          type: "file",
        });
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0]).toMatchObject({
        displayName: "Button.tsx",
        context: "selectedFile",
        type: "file",
      });
      expect(result.current.attachments[0].id).toBeDefined();
      expect(attachment!.id).toBe(result.current.attachments[0].id);

      // Wait for useEffect to run and register the merged helper with the attachment
      await waitFor(() => {
        const lastCall = mockAddContextHelper.mock.calls
          .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
          .pop();
        if (lastCall) {
          const helperFn = lastCall[1];
          const helperResult = helperFn();
          expect(helperResult).not.toBeNull();
          expect(helperResult).toHaveLength(1);
        } else {
          throw new Error("Helper not registered");
        }
      });

      // Verify the helper function returns the merged attachments array
      const helperFn = mockAddContextHelper.mock.calls
        .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
        .pop()?.[1];
      expect(helperFn).toBeDefined();
      const helperResult = helperFn!();
      expect(helperResult).toEqual([
        {
          id: attachment!.id,
          displayName: "Button.tsx",
          context: "selectedFile",
          type: "file",
        },
      ]);
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
        attachment = result.current.addContextAttachment({
          context: "selectedFile",
        });
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0]).toMatchObject({
        context: "selectedFile",
      });
      expect(result.current.attachments[0].displayName).toBeUndefined();
      expect(attachment!.id).toBe(result.current.attachments[0].id);
    });

    /**
     * Should add multiple different context attachments and update the merged helper
     */
    it("should add multiple context attachments", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          context: "file1",
          displayName: "Button.tsx",
          type: "file",
        });
        result.current.addContextAttachment({
          context: "file2",
          displayName: "Card.tsx",
          type: "file",
        });
      });

      expect(result.current.attachments).toHaveLength(2);
      expect(result.current.attachments[0].displayName).toBe("Button.tsx");
      expect(result.current.attachments[1].displayName).toBe("Card.tsx");

      // Wait for useEffect to run and update the merged helper
      await waitFor(() => {
        // The helper should be called/updated for each attachment change
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      // Verify the helper function returns all attachments
      const helperFn = mockAddContextHelper.mock.calls
        .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
        .pop()?.[1];
      expect(helperFn).toBeDefined();
      const helperResult = helperFn!();
      expect(helperResult).toHaveLength(2);
      expect(helperResult[0].displayName).toBe("Button.tsx");
      expect(helperResult[1].displayName).toBe("Card.tsx");
    });

    /**
     * Should allow multiple attachments with the same context value
     */
    it("should allow multiple attachments with same context value", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          context: "selectedFile",
          displayName: "Button.tsx",
          type: "file",
        });
        result.current.addContextAttachment({
          context: "selectedFile",
          displayName: "Card.tsx",
          type: "file",
        });
      });

      expect(result.current.attachments).toHaveLength(2);

      // Wait for useEffect to update the merged helper
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      // Verify both attachments are included in the merged result
      const helperFn = mockAddContextHelper.mock.calls
        .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
        .pop()?.[1];
      expect(helperFn).toBeDefined();
      const helperResult = helperFn!();
      expect(helperResult).toHaveLength(2);
    });

    /**
     * Should support optional type property
     */
    it("should support optional type property", () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          context: "file1",
          displayName: "Button.tsx",
          type: "file",
        });
        result.current.addContextAttachment({
          context: "page1",
          displayName: "Dashboard",
          type: "page",
        });
      });

      expect(result.current.attachments[0].type).toBe("file");
      expect(result.current.attachments[1].type).toBe("page");
    });
  });

  describe("Removing Context Attachments", () => {
    /**
     * Should remove a specific context attachment by ID and update the merged helper
     */
    it("should remove context attachment by ID", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let attachmentId = "";
      act(() => {
        const attachment = result.current.addContextAttachment({
          context: "selectedFile",
          displayName: "Button.tsx",
        });
        attachmentId = attachment.id;
      });

      expect(result.current.attachments).toHaveLength(1);

      // Wait for initial helper registration
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      act(() => {
        result.current.removeContextAttachment(attachmentId);
      });

      expect(result.current.attachments).toHaveLength(0);

      // Wait for useEffect to update the helper (should return null when empty)
      await waitFor(() => {
        const lastCall = mockAddContextHelper.mock.calls
          .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
          .pop();
        if (lastCall) {
          const helperFn = lastCall[1];
          expect(helperFn()).toBeNull();
        }
      });
    });

    /**
     * Should only remove the specified attachment when multiple exist
     */
    it("should only remove specified attachment", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      let firstId = "";
      act(() => {
        const first = result.current.addContextAttachment({
          context: "file1",
          displayName: "First.tsx",
        });
        result.current.addContextAttachment({
          context: "file2",
          displayName: "Second.tsx",
        });
        firstId = first.id;
      });

      expect(result.current.attachments).toHaveLength(2);

      // Wait for initial helper registration
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      act(() => {
        result.current.removeContextAttachment(firstId);
      });

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].displayName).toBe("Second.tsx");

      // Wait for useEffect to update the helper with remaining attachment
      await waitFor(() => {
        const lastCall = mockAddContextHelper.mock.calls
          .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
          .pop();
        if (lastCall) {
          const helperFn = lastCall[1];
          const helperResult = helperFn();
          expect(helperResult).toHaveLength(1);
          expect(helperResult[0].displayName).toBe("Second.tsx");
        }
      });
    });

    /**
     * Should handle removing non-existent attachment gracefully
     */
    it("should handle removing non-existent attachment gracefully", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      // Wait for initial helper registration (useEffect runs on mount)
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      expect(() => {
        act(() => {
          result.current.removeContextAttachment("non-existent-id");
        });
      }).not.toThrow();

      // The helper is registered on mount, so removeContextHelper will be called
      // when the component unmounts or when attachments change, but not for
      // removing a non-existent attachment since attachments didn't change
      // However, the cleanup function from the initial useEffect registration
      // may be called. Let's just verify the attachment list is still empty.
      expect(result.current.attachments).toHaveLength(0);
    });
  });

  describe("Clearing All Context Attachments", () => {
    /**
     * Should clear all context attachments and update the merged helper to return null
     */
    it("should clear all context attachments", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContextAttachment({
          context: "file1",
          displayName: "First.tsx",
        });
        result.current.addContextAttachment({
          context: "file2",
          displayName: "Second.tsx",
        });
        result.current.addContextAttachment({
          context: "file3",
          displayName: "Third.tsx",
        });
      });

      expect(result.current.attachments).toHaveLength(3);

      // Wait for initial helper registration
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      act(() => {
        result.current.clearContextAttachments();
      });

      expect(result.current.attachments).toHaveLength(0);

      // Wait for useEffect to update the helper (should return null when empty)
      await waitFor(() => {
        const lastCall = mockAddContextHelper.mock.calls
          .filter((call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY)
          .pop();
        if (lastCall) {
          const helperFn = lastCall[1];
          expect(helperFn()).toBeNull();
        }
      });
    });

    /**
     * Should handle clearing when no attachments exist
     */
    it("should handle clearing when no attachments exist", async () => {
      const { result } = renderHook(() => useTamboContextAttachment(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.clearContextAttachments();
        });
      }).not.toThrow();

      expect(result.current.attachments).toHaveLength(0);

      // Wait for useEffect to run - helper should be registered and return null
      await waitFor(() => {
        expect(mockAddContextHelper).toHaveBeenCalledWith(
          CONTEXT_ATTACHMENTS_HELPER_KEY,
          expect.any(Function),
        );
      });

      const helperFn = mockAddContextHelper.mock.calls.find(
        (call) => call[0] === CONTEXT_ATTACHMENTS_HELPER_KEY,
      )?.[1];
      expect(helperFn).toBeDefined();
      expect(helperFn!()).toBeNull();
    });
  });
});
