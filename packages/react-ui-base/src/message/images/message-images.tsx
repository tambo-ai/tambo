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
  slot: string;
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
  /**
   * Keep the element mounted when there are no images. When false (default),
   * the component returns null if the message has no image content.
   * @default false
   */
  keepMounted?: boolean;
}

/**
 * Images primitive for displaying message images.
 * Extracts images from message content and renders them.
 */
export const MessageImages = React.forwardRef<
  HTMLDivElement,
  MessageImagesProps
>(({ renderImage, children, keepMounted = false, ...props }, ref) => {
  const { message } = useMessageRootContext();
  const images = getMessageImages(message.content);

  const { render, ...componentProps } = props;
  const renderProps: MessageImagesRenderProps = {
    slot: "message-images",
    images,
  };
  const renderedImages = React.useMemo(
    () =>
      images.map((url: string, index: number) =>
        renderImage ? (
          <React.Fragment key={index}>
            {renderImage({ url, index })}
          </React.Fragment>
        ) : (
          <img key={index} src={url} alt={`Image ${index + 1}`} />
        ),
      ),
    [images, renderImage],
  );

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    enabled: keepMounted || images.length > 0,
    state: renderProps,
    stateAttributesMapping: {
      images: () => null,
    },
    props: mergeProps(componentProps, {
      children: children ?? renderedImages,
    }),
  });
});
MessageImages.displayName = "Message.Images";
