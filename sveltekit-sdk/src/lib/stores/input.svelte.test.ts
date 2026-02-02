/**
 * Tests for the input store using Svelte component testing.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cleanup } from "@testing-library/svelte";
import { tick } from "svelte";
import { createInputStore } from "./input.svelte.js";

// For testing stores with runes, we need to run them in a Svelte context
// Using a test harness approach

describe("createInputStore", () => {
  let store: ReturnType<typeof createInputStore>;

  beforeEach(() => {
    cleanup();
    store = createInputStore();
  });

  describe("initial state", () => {
    it("should have empty initial value", () => {
      expect(store.value).toBe("");
    });

    it("should have empty initial stagedImages", () => {
      expect(store.stagedImages).toEqual([]);
    });

    it("should have isSubmitting as false", () => {
      expect(store.isSubmitting).toBe(false);
    });

    it("should have images alias equal to stagedImages", () => {
      expect(store.images).toBe(store.stagedImages);
    });
  });

  describe("setValue", () => {
    it("should update value", async () => {
      store.setValue("test input");
      await tick();
      expect(store.value).toBe("test input");
    });

    it("should allow empty string", async () => {
      store.setValue("something");
      await tick();
      store.setValue("");
      await tick();
      expect(store.value).toBe("");
    });
  });

  describe("clear", () => {
    it("should clear value", async () => {
      store.setValue("test");
      await tick();
      store.clear();
      await tick();
      expect(store.value).toBe("");
    });

    it("should clear stagedImages", async () => {
      store.addImage({
        id: "1",
        name: "test.png",
        dataUrl: "data:image/png;base64,",
        file: new File([], "test.png"),
      });
      await tick();
      store.clear();
      await tick();
      expect(store.stagedImages).toEqual([]);
    });
  });

  describe("addImage", () => {
    it("should add a StagedImage object", async () => {
      const image = {
        id: "test-id",
        name: "test.png",
        dataUrl: "data:image/png;base64,abc123",
        file: new File([""], "test.png", { type: "image/png" }),
      };

      store.addImage(image);
      await tick();

      expect(store.stagedImages).toHaveLength(1);
      expect(store.stagedImages[0]).toEqual(image);
    });

    it("should add a File and convert to StagedImage", async () => {
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

      // addImage with File returns a Promise
      await store.addImage(file);
      await tick();

      expect(store.stagedImages).toHaveLength(1);
      expect(store.stagedImages[0].name).toBe("photo.jpg");
      expect(store.stagedImages[0].file).toBe(file);
      expect(store.stagedImages[0].id).toBeDefined();
      expect(store.stagedImages[0].dataUrl).toContain("data:");
    });
  });

  describe("addImages", () => {
    it("should add multiple files", async () => {
      const files = [
        new File(["content1"], "image1.png", { type: "image/png" }),
        new File(["content2"], "image2.jpg", { type: "image/jpeg" }),
      ];

      await store.addImages(files);
      await tick();

      expect(store.stagedImages).toHaveLength(2);
      expect(store.stagedImages[0].name).toBe("image1.png");
      expect(store.stagedImages[1].name).toBe("image2.jpg");
    });
  });

  describe("removeImage", () => {
    it("should remove image by id", async () => {
      const image1 = {
        id: "1",
        name: "a.png",
        dataUrl: "data:",
        file: new File([], "a.png"),
      };
      const image2 = {
        id: "2",
        name: "b.png",
        dataUrl: "data:",
        file: new File([], "b.png"),
      };

      store.addImage(image1);
      store.addImage(image2);
      await tick();

      store.removeImage("1");
      await tick();

      expect(store.stagedImages).toHaveLength(1);
      expect(store.stagedImages[0].id).toBe("2");
    });

    it("should do nothing if id not found", async () => {
      const image = {
        id: "1",
        name: "a.png",
        dataUrl: "data:",
        file: new File([], "a.png"),
      };
      store.addImage(image);
      await tick();

      store.removeImage("nonexistent");
      await tick();

      expect(store.stagedImages).toHaveLength(1);
    });
  });

  describe("clearImages", () => {
    it("should remove all images", async () => {
      store.addImage({
        id: "1",
        name: "a.png",
        dataUrl: "data:",
        file: new File([], "a.png"),
      });
      store.addImage({
        id: "2",
        name: "b.png",
        dataUrl: "data:",
        file: new File([], "b.png"),
      });
      await tick();

      store.clearImages();
      await tick();

      expect(store.stagedImages).toEqual([]);
    });
  });

  describe("setSubmitting", () => {
    it("should set isSubmitting to true", async () => {
      store.setSubmitting(true);
      await tick();
      expect(store.isSubmitting).toBe(true);
    });

    it("should set isSubmitting to false", async () => {
      store.setSubmitting(true);
      await tick();
      store.setSubmitting(false);
      await tick();
      expect(store.isSubmitting).toBe(false);
    });
  });
});
