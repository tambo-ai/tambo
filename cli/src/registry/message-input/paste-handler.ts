export const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

export const MAX_IMAGES = 10;

declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

export interface ImageItems {
  imageItems: File[];
  hasText: boolean;
}

export function getImageItems(
  clipboardData: DataTransfer | null | undefined,
): ImageItems {
  const items = Array.from(clipboardData?.items ?? []);
  const imageItems: File[] = [];

  for (const item of items) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const image = item.getAsFile();
    if (image) {
      imageItems.push(image);
    }
  }

  const text = clipboardData?.getData("text/plain") ?? "";

  return {
    imageItems,
    hasText: text.length > 0,
  };
}

export interface HandlePastedImagesOptions {
  currentImageCount: number;
  maxImages: number;
  setImageError: (error: string | null) => void;
  addImage: (file: File) => Promise<void>;
}

export interface HandlePastedImagesResult {
  hasImages: boolean;
  hasText: boolean;
  success: boolean;
}

export async function handlePastedImages(
  clipboardData: DataTransfer | null | undefined,
  options: HandlePastedImagesOptions,
): Promise<HandlePastedImagesResult> {
  const { currentImageCount, maxImages, setImageError, addImage } = options;
  const { imageItems, hasText } = getImageItems(clipboardData);

  if (imageItems.length === 0) {
    return { hasImages: false, hasText, success: true };
  }

  const totalImages = currentImageCount + imageItems.length;
  if (totalImages > maxImages) {
    setImageError(`Max ${maxImages} uploads at a time`);
    return { hasImages: true, hasText, success: false };
  }

  setImageError(null);

  let success = true;
  for (const item of imageItems) {
    try {
      item[IS_PASTED_IMAGE] = true;
      await addImage(item);
    } catch (error) {
      console.error("Failed to add pasted image:", error);
      success = false;
    }
  }

  return { hasImages: true, hasText, success };
}
