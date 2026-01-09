import { act, renderHook } from "@testing-library/react";
import { useMessageAttachments } from "./use-message-attachments";

global.crypto = {
  randomUUID: jest.fn(() => "mock-uuid"),
} as Crypto;

const createFileReader = () => {
  const reader = {
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    onload: null as ((e: unknown) => void) | null,
    onerror: null as ((e: unknown) => void) | null,
    result: "",
  };

  reader.readAsDataURL = jest.fn(() => {
    reader.result = "data:application/pdf;base64,mock-doc";
    setTimeout(() => {
      reader.onload?.({} as unknown);
    }, 0);
  });

  reader.readAsText = jest.fn(() => {
    reader.result = "mock text content";
    setTimeout(() => {
      reader.onload?.({} as unknown);
    }, 0);
  });

  return reader;
};

(global as { FileReader: unknown }).FileReader = jest.fn(() =>
  createFileReader(),
);

describe("useMessageAttachments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as { FileReader: unknown }).FileReader = jest.fn(() =>
      createFileReader(),
    );
  });

  it("should include dataUrl for documents when no client is provided", async () => {
    const { result } = renderHook(() => useMessageAttachments());
    const file = new File(["%PDF-1.4"], "doc.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await result.current.addAttachment(file);
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].attachmentType).toBe("document");
    expect(result.current.attachments[0].dataUrl).toBe(
      "data:application/pdf;base64,mock-doc",
    );
  });
});
