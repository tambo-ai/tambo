import { useCallback, useState } from "react";

// Only image attachments are supported today. Add new literal types here when expanding support.
export type TamboAttachmentKind = "image";

/**
 * Represents a staged file attachment ready to be sent with a message
 */
export interface StagedAttachment {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
  size: number;
  type: string;
  kind: TamboAttachmentKind;
  previewUrl?: string;
  lastModified: number;
}

export interface UseMessageAttachmentsOptions {
  /**
   * Optional validator invoked for each file before it is staged.
   * Throw to reject the attachment. This runs in addition to the built-in
   * image-only guard; remove or widen that guard when supporting more formats.
   */
  validateFile?: (file: File) => Promise<void> | void;
  /**
   * Optional mapper to extend or override attachment metadata.
   * Useful for injecting kind detection or previews.
   */
  mapFileToAttachment?: (
    file: File,
    dataUrl: string,
  ) => Promise<Partial<StagedAttachment> | void> | Partial<StagedAttachment>;
}

export interface UseMessageAttachmentsReturn {
  attachments: StagedAttachment[];
  addAttachment: (file: File) => Promise<StagedAttachment>;
  addAttachments: (files: File[]) => Promise<StagedAttachment[]>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

const detectAttachmentKind = (file: File): TamboAttachmentKind => {
  if (file.type.startsWith("image/")) return "image";

  throw new Error(
    "Only image attachments are supported. Extend detectAttachmentKind to enable additional file types.",
  );
};

const fileToDataUrl = async (file: File): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const buildAttachment = async (
  file: File,
  options?: UseMessageAttachmentsOptions,
): Promise<StagedAttachment> => {
  if (options?.validateFile) {
    await options.validateFile(file);
  }

  // Determine attachment kind up front to guard unsupported types before doing any expensive work.
  const kind = detectAttachmentKind(file);
  const dataUrl = await fileToDataUrl(file);
  const base: StagedAttachment = {
    id: crypto.randomUUID(),
    name: file.name,
    dataUrl,
    file,
    size: file.size,
    type: file.type,
    kind,
    previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
    lastModified: file.lastModified,
  };

  if (options?.mapFileToAttachment) {
    const overrides = await options.mapFileToAttachment(file, dataUrl);
    if (overrides) {
      return {
        ...base,
        ...overrides,
      };
    }
  }

  return base;
};

/**
 * Hook for managing staged file attachments in message input components.
 * @returns Object with attachments array and management helpers.
 */
export function useMessageAttachments(
  options?: UseMessageAttachmentsOptions,
): UseMessageAttachmentsReturn {
  const [attachments, setAttachments] = useState<StagedAttachment[]>([]);

  const addAttachment = useCallback(
    async (file: File) => {
      const attachment = await buildAttachment(file, options);
      setAttachments((prev) => [...prev, attachment]);
      return attachment;
    },
    [options],
  );

  const addAttachments = useCallback(
    async (files: File[]) => {
      const staged = await Promise.all(
        files.map(async (file) => await buildAttachment(file, options)),
      );
      setAttachments((prev) => [...prev, ...staged]);
      return staged;
    },
    [options],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
  };
}

/**
 * @deprecated Use useMessageAttachments instead.
 */
export type StagedImage = StagedAttachment;
/**
 * @deprecated Use useMessageAttachments instead.
 */
export interface UseMessageImagesReturn {
  images: StagedImage[];
  addImage: (file: File) => Promise<StagedImage>;
  addImages: (files: File[]) => Promise<StagedImage[]>;
  removeImage: (id: string) => void;
  clearImages: () => void;
}
/**
 * @deprecated Use useMessageAttachments instead.
 * @returns Deprecated image-focused attachment helpers.
 */
export function useMessageImages(): UseMessageImagesReturn {
  const {
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
  } = useMessageAttachments({
    validateFile: (file) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }
    },
  });

  return {
    images: attachments,
    addImage: addAttachment,
    addImages: addAttachments,
    removeImage: removeAttachment,
    clearImages: clearAttachments,
  };
}
