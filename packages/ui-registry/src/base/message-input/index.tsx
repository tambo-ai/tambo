"use client";

import { MessageInputContent } from "./message-input-content";
import { MessageInputContext } from "./message-input-context";
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
 * import { MessageInput } from "@tambo-ai/ui-registry/base/message-input";
 *
 * function MyMessageInput() {
 *   return (
 *     <MessageInput.Root className="my-form">
 *       <MessageInput.Content className="my-content">
 *         {({ isDragging, elicitation, resolveElicitation }) => (
 *           <>
 *             {isDragging && <div>Drop files here</div>}
 *             {elicitation && resolveElicitation ? (
 *               <div>Elicitation UI here</div>
 *             ) : (
 *               <>
 *                 <MessageInput.StagedImages>
 *                   {({ images }) => (
 *                     <div className="flex gap-2">
 *                       {images.map(({ image, displayName, onRemove }) => (
 *                         <div key={image.id}>
 *                           <img src={image.dataUrl} alt={displayName} />
 *                           <button onClick={onRemove}>Remove</button>
 *                         </div>
 *                       ))}
 *                     </div>
 *                   )}
 *                 </MessageInput.StagedImages>
 *                 <MessageInput.Textarea>
 *                   {({ value, setValue, disabled }) => (
 *                     <textarea
 *                       value={value}
 *                       onChange={(e) => setValue(e.target.value)}
 *                       disabled={disabled}
 *                     />
 *                   )}
 *                 </MessageInput.Textarea>
 *                 <MessageInput.Toolbar>
 *                   <MessageInput.FileButton>
 *                     {({ openFilePicker }) => (
 *                       <button onClick={openFilePicker}>Attach</button>
 *                     )}
 *                   </MessageInput.FileButton>
 *                   <MessageInput.SubmitButton>
 *                     {({ showCancelButton }) =>
 *                       showCancelButton ? "Cancel" : "Send"
 *                     }
 *                   </MessageInput.SubmitButton>
 *                 </MessageInput.Toolbar>
 *               </>
 *             )}
 *           </>
 *         )}
 *       </MessageInput.Content>
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
  /** Provides value/setValue/editorRef via render props for components that need to modify input */
  ValueAccess: MessageInputValueAccess,
  /** Internal: The React Context used by MessageInput */
  Context: MessageInputContext,
};

// Re-export types and constants
export type {
  MessageInputContextValue,
  PromptItem,
  PromptProvider,
  ResourceItem,
  ResourceProvider,
  StagedImage,
  TamboEditor,
} from "./message-input-context";
export { IS_PASTED_IMAGE, MAX_IMAGES } from "./message-input-context";
export type {
  MessageInputContentProps,
  MessageInputContentRenderProps,
} from "./message-input-content";
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

// Export format option types for Textarea props
export type {
  PromptFormatOptions,
  ResourceFormatOptions,
} from "./use-combined-lists";
