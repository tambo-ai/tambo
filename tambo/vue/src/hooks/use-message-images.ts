import { ref } from "vue";

export interface StagedImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
  size: number;
  type: string;
}

export function useMessageImages() {
  const images = ref<StagedImage[]>([]);

  const fileToDataUrl = async (file: File): Promise<string> => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }
    const dataUrl = await fileToDataUrl(file);
    images.value = [
      ...images.value,
      {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        file,
        size: file.size,
        type: file.type,
      },
    ];
  };

  const addImages = async (files: File[]) => {
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
        } as StagedImage;
      }),
    );
    images.value = [...images.value, ...newImages];
  };

  const removeImage = (id: string) => {
    images.value = images.value.filter((img) => img.id !== id);
  };

  const clearImages = () => {
    images.value = [];
  };

  return { images, addImage, addImages, removeImage, clearImages };
}

