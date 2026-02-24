"use client";

import {
  IS_PASTED_IMAGE as _IS_PASTED_IMAGE,
  MAX_IMAGES as _MAX_IMAGES,
} from "./constants";
import { MessageInputContent } from "./message-input-content";
import { MessageInputError } from "./message-input-error";
import { MessageInputFileButton } from "./message-input-file-button";
import { MessageInputRoot } from "./message-input-root";
import { MessageInputStagedImages } from "./message-input-staged-images";
import { MessageInputSubmitButton } from "./message-input-submit-button";
import { MessageInputTextarea } from "./message-input-textarea";
import { MessageInputToolbar } from "./message-input-toolbar";
import { MessageInputValueAccess } from "./message-input-value-access";

/**
 * Headless compound component for building message input interfaces.
 *
 * @example
 * ```tsx
 * import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
 *
 * function MyMessageInput() {
 *   return (
 *     <MessageInput.Root className="my-form">
 *       <MessageInput.Content
 *         className="my-content"
 *         render={(_props, { isDragging, elicitation, resolveElicitation }) => (
 *           <>
 *             {isDragging && <div>Drop files here</div>}
 *             {elicitation && resolveElicitation ? (
 *               <div>Elicitation UI here</div>
 *             ) : (
 *               <>
 *                 <MessageInput.StagedImages
 *                   render={(_props, { images }) => (
 *                     <div className="flex gap-2">
 *                       {images.map(({ image, displayName, onRemove }) => (
 *                         <div key={image.id}>
 *                           <img src={image.dataUrl} alt={displayName} />
 *                           <button onClick={onRemove}>Remove</button>
 *                         </div>
 *                       ))}
 *                     </div>
 *                   )}
 *                 />
 *                 <MessageInput.Textarea
 *                   render={(_props, { value, setValue, disabled }) => (
 *                     <textarea
 *                       value={value}
 *                       onChange={(e) => setValue(e.target.value)}
 *                       disabled={disabled}
 *                     />
 *                   )}
 *                 />
 *                 <MessageInput.Toolbar>
 *                   <MessageInput.FileButton
 *                     render={(_props, { openFilePicker }) => (
 *                       <button onClick={openFilePicker}>Attach</button>
 *                     )}
 *                   />
 *                   <MessageInput.SubmitButton
 *                     render={(_props, { showCancelButton }) => (
 *                       <>{showCancelButton ? "Cancel" : "Send"}</>
 *                     )}
 *                   />
 *                 </MessageInput.Toolbar>
 *               </>
 *             )}
 *           </>
 *         )}
 *       />
 *       <MessageInput.Error />
 *     </MessageInput.Root>
 *   );
 * }
 * ```
 */
export const MessageInput = {
  Root: MessageInputRoot,
  Content: MessageInputContent,
  Textarea: MessageInputTextarea,
  SubmitButton: MessageInputSubmitButton,
  FileButton: MessageInputFileButton,
  Error: MessageInputError,
  StagedImages: MessageInputStagedImages,
  Toolbar: MessageInputToolbar,
  ValueAccess: MessageInputValueAccess,
};

// Re-export constants — aliased through local consts because Vite/Rolldown
// tree-shakes bare re-exports even with preserveModules enabled.
export const MAX_IMAGES: typeof _MAX_IMAGES = _MAX_IMAGES;
export const IS_PASTED_IMAGE: typeof _IS_PASTED_IMAGE = _IS_PASTED_IMAGE;
export type {
  MessageInputContentProps,
  MessageInputContentRenderProps,
} from "./message-input-content";
export type {
  MessageInputContextValue,
  PromptItem,
  PromptProvider,
  ResourceItem,
  ResourceProvider,
  StagedImage,
  TamboEditor,
} from "./message-input-context";
export type {
  MessageInputErrorProps,
  MessageInputErrorRenderProps,
} from "./message-input-error";
export type {
  MessageInputFileButtonProps,
  MessageInputFileButtonRenderProps,
} from "./message-input-file-button";
export type { MessageInputRootProps } from "./message-input-root";
export type {
  MessageInputStagedImagesProps,
  MessageInputStagedImagesRenderProps,
  StagedImageRenderProps,
} from "./message-input-staged-images";
export type {
  MessageInputSubmitButtonProps,
  MessageInputSubmitButtonRenderProps,
} from "./message-input-submit-button";
export type {
  MessageInputTextareaProps,
  MessageInputTextareaRenderProps,
} from "./message-input-textarea";
export type { MessageInputToolbarProps } from "./message-input-toolbar";
export type {
  MessageInputValueAccessProps,
  MessageInputValueAccessRenderProps,
} from "./message-input-value-access";
export type {
  PromptFormatOptions,
  ResourceFormatOptions,
} from "./use-combined-lists";
