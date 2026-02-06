"use client";

import { CanvasSpaceContent } from "./content/canvas-space-content";
import { CanvasSpaceEmptyState } from "./empty-state/canvas-space-empty-state";
import { CanvasSpaceRoot } from "./root/canvas-space-root";
import { CanvasSpaceViewport } from "./viewport/canvas-space-viewport";

/**
 * CanvasSpace namespace containing all canvas space base components.
 */
const CanvasSpace = {
  Root: CanvasSpaceRoot,
  Viewport: CanvasSpaceViewport,
  Content: CanvasSpaceContent,
  EmptyState: CanvasSpaceEmptyState,
};

export type {
  CanvasSpaceContentProps,
  CanvasSpaceContentRenderProps,
} from "./content/canvas-space-content";
export type { CanvasSpaceEmptyStateProps } from "./empty-state/canvas-space-empty-state";
export type { CanvasSpaceRootProps } from "./root/canvas-space-root";
export type { CanvasSpaceViewportProps } from "./viewport/canvas-space-viewport";

export { CanvasSpace };
