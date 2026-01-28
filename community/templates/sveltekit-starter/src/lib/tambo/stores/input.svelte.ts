import type { StagedImage } from "../types.js";

/**
 * Input store for managing chat input state
 */
export function createInputStore() {
  let value = $state("");
  let images = $state<StagedImage[]>([]);
  let isPending = $state(false);

  return {
    get value() {
      return value;
    },
    get images() {
      return images;
    },
    get isPending() {
      return isPending;
    },

    setValue(newValue: string) {
      value = newValue;
    },

    setIsPending(pending: boolean) {
      isPending = pending;
    },

    /**
     * Add an image to the staged images
     */
    async addImage(file: File): Promise<void> {
      const dataUrl = await fileToDataUrl(file);
      const image: StagedImage = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        dataUrl,
      };
      images = [...images, image];
    },

    /**
     * Add multiple images
     */
    async addImages(files: File[]): Promise<void> {
      const newImages = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          return {
            id: crypto.randomUUID(),
            file,
            name: file.name,
            dataUrl,
          };
        }),
      );
      images = [...images, ...newImages];
    },

    /**
     * Remove an image by ID
     */
    removeImage(id: string) {
      images = images.filter((img) => img.id !== id);
    },

    /**
     * Clear all staged images
     */
    clearImages() {
      images = [];
    },

    /**
     * Clear all input state
     */
    clear() {
      value = "";
      images = [];
      isPending = false;
    },
  };
}

/**
 * Convert a file to a data URL
 */
async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type InputStore = ReturnType<typeof createInputStore>;
