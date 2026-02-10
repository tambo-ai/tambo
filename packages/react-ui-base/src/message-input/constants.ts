/**
 * Maximum number of images that can be staged at once.
 */
export const MAX_IMAGES = 10;

/**
 * Symbol for marking pasted images.
 * Uses a unique well-known symbol to detect if an image was pasted vs uploaded.
 */
export const IS_PASTED_IMAGE: unique symbol = Symbol.for(
  "tambo-is-pasted-image",
) as typeof IS_PASTED_IMAGE;
