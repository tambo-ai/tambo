import type { StagedImage } from "../types.js";

/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

/**
 * Maximum file size for image uploads (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate an image file for upload
 * @param file - File to validate
 * @throws Error if file is invalid
 */
function validateImageFile(file: File): void {
  // Validate MIME type
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  // Validate filename (prevent path traversal)
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    throw new Error("Invalid filename");
  }
}

/**
 * Convert a File to a data URL
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Input store interface
 */
export interface InputStore {
  readonly value: string;
  readonly stagedImages: StagedImage[];
  /** @deprecated Use stagedImages instead */
  readonly images: StagedImage[];
  readonly isSubmitting: boolean;
  setValue(value: string): void;
  clear(): void;
  addImage(imageOrFile: StagedImage | File): void | Promise<void>;
  addImages(files: File[]): Promise<void>;
  removeImage(id: string): void;
  clearImages(): void;
  setSubmitting(submitting: boolean): void;
}

/**
 * Create an input store for managing user input state
 * @returns Input store with reactive state
 */
export function createInputStore(): InputStore {
  let value = $state("");
  let stagedImages = $state<StagedImage[]>([]);
  let isSubmitting = $state(false);

  function setValue(newValue: string): void {
    value = newValue;
  }

  function clear(): void {
    value = "";
    stagedImages = [];
  }

  function addImage(imageOrFile: StagedImage | File): void | Promise<void> {
    if (imageOrFile instanceof File) {
      return addImageFromFile(imageOrFile);
    }
    stagedImages = [...stagedImages, imageOrFile];
  }

  async function addImageFromFile(file: File): Promise<void> {
    validateImageFile(file);
    const dataUrl = await fileToDataUrl(file);
    const image: StagedImage = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      dataUrl,
    };
    stagedImages = [...stagedImages, image];
  }

  async function addImages(files: File[]): Promise<void> {
    // Validate all files first before processing
    for (const file of files) {
      validateImageFile(file);
    }
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
    stagedImages = [...stagedImages, ...newImages];
  }

  function removeImage(id: string): void {
    stagedImages = stagedImages.filter((img) => img.id !== id);
  }

  function clearImages(): void {
    stagedImages = [];
  }

  function setSubmitting(submitting: boolean): void {
    isSubmitting = submitting;
  }

  return {
    get value() {
      return value;
    },
    get stagedImages() {
      return stagedImages;
    },
    // Alias for backwards compatibility
    get images() {
      return stagedImages;
    },
    get isSubmitting() {
      return isSubmitting;
    },
    setValue,
    clear,
    addImage,
    addImages,
    removeImage,
    clearImages,
    setSubmitting,
  };
}

export type { InputStore as InputStoreType };
