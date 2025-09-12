import { useCallback, useState } from "react";

/**
 * Represents an image staged for upload
 */
export interface StagedImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
  size: number;
  type: string;
}

interface UseMessageImagesReturn {
  images: StagedImage[];
  addImage: (file: File) => Promise<void>;
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
}

/**
 * Hook for managing images in message input
 * @returns Object with images array and management functions
 */
export function useMessageImages(): UseMessageImagesReturn {
  const [images, setImages] = useState<StagedImage[]>([]);

  const fileToDataUrl = async (file: File): Promise<string> => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    const dataUrl = await fileToDataUrl(file);
    const newImage: StagedImage = {
      id: crypto.randomUUID(),
      name: file.name,
      dataUrl,
      file,
      size: file.size,
      type: file.type,
    };

    setImages((prev) => [...prev, newImage]);
  }, []);

  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      throw new Error("No valid image files provided");
    }

    const newImages = await Promise.all(
      imageFiles.map(async (file) => {
        const dataUrl = await fileToDataUrl(file);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          file,
          size: file.size,
          type: file.type,
        };
      }),
    );

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    addImage,
    addImages,
    removeImage,
    clearImages,
  };
}
