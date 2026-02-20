"use client";

import {
  IS_PASTED_IMAGE as _IS_PASTED_IMAGE,
  MAX_IMAGES as _MAX_IMAGES,
} from "./constants";
import { MessageInputContent } from "./message-input-content";
import { MessageInputElicitation } from "./message-input-elicitation";
import { MessageInputError } from "./message-input-error";
import { MessageInputFileButton } from "./message-input-file-button";
import { MessageInputRoot } from "./message-input-root";
import { MessageInputStagedImages } from "./message-input-staged-images";
import { MessageInputStopButton } from "./message-input-stop-button";
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
 *       <MessageInput.Content className="my-content">
 *         <MessageInput.StagedImages>
 *           {({ images }) => (
 *             <div className="flex gap-2">
 *               {images.map(({ image, displayName, onRemove }) => (
 *                 <div key={image.id}>
 *                   <img src={image.dataUrl} alt={displayName} />
 *                   <button onClick={onRemove}>Remove</button>
 *                 </div>
 *               ))}
 *             </div>
 *           )}
 *         </MessageInput.StagedImages>
 *         <MessageInput.Textarea>
 *           {({ value, setValue, disabled }) => (
 *             <textarea
 *               value={value}
 *               onChange={(e) => setValue(e.target.value)}
 *               disabled={disabled}
 *             />
 *           )}
 *         </MessageInput.Textarea>
 *         <MessageInput.Toolbar>
 *           <MessageInput.FileButton>
 *             {({ openFilePicker }) => (
 *               <button onClick={openFilePicker}>Attach</button>
 *             )}
 *           </MessageInput.FileButton>
 *           <MessageInput.SubmitButton keepMounted>Send</MessageInput.SubmitButton>
 *           <MessageInput.StopButton keepMounted>Stop</MessageInput.StopButton>
 *         </MessageInput.Toolbar>
 *       </MessageInput.Content>
 *       <MessageInput.Elicitation />
 *       <MessageInput.Error />
 *     </MessageInput.Root>
 *   );
 * }
 * ```
 */
export const MessageInput = {
  Root: MessageInputRoot,
  Content: MessageInputContent,
  Elicitation: MessageInputElicitation,
  Textarea: MessageInputTextarea,
  SubmitButton: MessageInputSubmitButton,
  StopButton: MessageInputStopButton,
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
  MessageInputElicitationProps,
  MessageInputElicitationRenderProps,
} from "./message-input-elicitation";
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
  MessageInputStopButtonProps,
  MessageInputStopButtonRenderProps,
} from "./message-input-stop-button";
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
