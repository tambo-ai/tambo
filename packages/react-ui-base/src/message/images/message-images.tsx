import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
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

export interface MessageImagesRenderProps extends Record<string, unknown> {
  images: string[];
}

type MessageImagesComponentProps = useRender.ComponentProps<
  "div",
  MessageImagesRenderProps
>;

export interface MessageImagesProps extends Omit<
  MessageImagesComponentProps,
  "children"
> {
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
>(({ renderImage, children, ...props }, ref) => {
  const { message } = useMessageRootContext();
  const images = getMessageImages(message.content);

  if (images.length === 0) {
    return null;
  }
  const { render, ...componentProps } = props;
  const renderProps: MessageImagesRenderProps = {
    images,
  };
  const defaultChildren =
    children ??
    images.map((url: string, index: number) =>
      renderImage ? (
        <React.Fragment key={index}>
          {renderImage({ url, index })}
        </React.Fragment>
      ) : (
        <img key={index} src={url} alt={`Image ${index + 1}`} />
      ),
    );

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children: defaultChildren,
      "data-slot": "message-images",
    }),
  });
});
MessageImages.displayName = "Message.Images";
