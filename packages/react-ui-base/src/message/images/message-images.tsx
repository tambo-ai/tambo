import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { getMessageImages } from "../../utils/message-content";
import { useMessageRootContext } from "../root/message-root-context";

/**
 * Props passed to the renderImage callback.
 */
export interface MessageImageRenderFnProps {
  /** The image URL. */
  url: string;
  /** The index of the image in the list. */
  index: number;
  /** The alt text for the image. */
  alt?: string;
}

export interface MessageImagesProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /**
   * Render prop for each image. If not provided, renders basic img elements.
   */
  renderImage?: (props: MessageImageRenderFnProps) => React.ReactNode;
  /** Children to render instead of the default image list. */
  children?: React.ReactNode;
}

/**
 * Images primitive for displaying message images.
 * Extracts images from message content and renders them.
 */
export const MessageImages = React.forwardRef<
  HTMLDivElement,
  MessageImagesProps
>(({ asChild, renderImage, children, ...props }, ref) => {
  const { message } = useMessageRootContext();
  const images = getMessageImages(message.content);

  if (images.length === 0) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="message-images" {...props}>
      {children ??
        images.map((url: string, index: number) =>
          renderImage ? (
            <React.Fragment key={index}>
              {renderImage({ url, index })}
            </React.Fragment>
          ) : (
            <img key={index} src={url} alt={`Image ${index + 1}`} />
          ),
        )}
    </Comp>
  );
});
MessageImages.displayName = "Message.Images";
