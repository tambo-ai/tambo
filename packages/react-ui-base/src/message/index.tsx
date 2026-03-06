"use client";

import { MessageContent } from "./content/message-content";
import { MessageImages } from "./images/message-images";
import { MessageLoadingIndicator } from "./loading-indicator/message-loading-indicator";
import { MessageRenderedComponent } from "./rendered-component/rendered-component";
import { MessageRenderedComponentCanvasButton } from "./rendered-component/rendered-component-canvas-button";
import { MessageRenderedComponentContent } from "./rendered-component/rendered-component-content";
import { MessageRoot } from "./root/message-root";

/**
 * Message namespace containing all message base components.
 */
const Message = {
  Root: MessageRoot,
  Content: MessageContent,
  Images: MessageImages,
  LoadingIndicator: MessageLoadingIndicator,
  RenderedComponent: MessageRenderedComponent,
  RenderedComponentContent: MessageRenderedComponentContent,
  RenderedComponentCanvasButton: MessageRenderedComponentCanvasButton,
};

export type {
  MessageContentProps,
  MessageContentState,
} from "./content/message-content";
export type {
  MessageImageRenderFnProps,
  MessageImagesProps,
} from "./images/message-images";
export type { MessageLoadingIndicatorProps } from "./loading-indicator/message-loading-indicator";
export type { MessageRenderedComponentProps } from "./rendered-component/rendered-component";
export type {
  MessageRootComponentProps,
  MessageRootProps,
  MessageRootState,
} from "./root/message-root";

export type { useRender } from "@base-ui/react/use-render";

export { Message };
