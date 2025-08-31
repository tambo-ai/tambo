import { renderHook } from "@testing-library/react";
import { useFileValidation } from "../hooks/useFileValidation";

describe("useFileValidation", () => {
  it("validates file size correctly", () => {
    const { result } = renderHook(() => useFileValidation(undefined, 1)); // 1MB limit

    const smallFile = new File(["small"], "small.txt", { type: "text/plain" });
    const largeFile = new File(["x".repeat(2 * 1024 * 1024)], "large.txt", {
      type: "text/plain",
    });

    expect(result.current.validateFile(smallFile).isValid).toBe(true);
    expect(result.current.validateFile(largeFile).isValid).toBe(false);
    expect(result.current.validateFile(largeFile).error).toContain(
      "exceeds 1MB",
    );
  });

  it("validates file types correctly", () => {
    const { result } = renderHook(() => useFileValidation("image/*"));

    const imageFile = new File(["image"], "image.jpg", { type: "image/jpeg" });
    const textFile = new File(["text"], "text.txt", { type: "text/plain" });

    expect(result.current.validateFile(imageFile).isValid).toBe(true);
    expect(result.current.validateFile(textFile).isValid).toBe(false);
  });

  it("handles wildcard accept patterns", () => {
    const { result } = renderHook(() => useFileValidation("*"));

    const anyFile = new File(["content"], "any.xyz", {
      type: "application/xyz",
    });

    expect(result.current.validateFile(anyFile).isValid).toBe(true);
  });

  it("handles file extensions", () => {
    const { result } = renderHook(() => useFileValidation(".jpg,.png"));

    const jpgFile = new File(["image"], "image.jpg", { type: "image/jpeg" });
    const pngFile = new File(["image"], "image.png", { type: "image/png" });
    const txtFile = new File(["text"], "text.txt", { type: "text/plain" });

    expect(result.current.validateFile(jpgFile).isValid).toBe(true);
    expect(result.current.validateFile(pngFile).isValid).toBe(true);
    expect(result.current.validateFile(txtFile).isValid).toBe(false);
  });
});
