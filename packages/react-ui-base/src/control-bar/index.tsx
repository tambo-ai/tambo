"use client";

import { ControlBarContent } from "./content/control-bar-content";
import { ControlBarOverlay } from "./overlay/control-bar-overlay";
import { ControlBarPortal } from "./portal/control-bar-portal";
import { ControlBarRoot } from "./root/control-bar-root";
import { ControlBarTitle } from "./title/control-bar-title";
import { ControlBarTrigger } from "./trigger/control-bar-trigger";

/**
 * ControlBar namespace containing all control bar base components.
 */
const ControlBar = {
  Root: ControlBarRoot,
  Trigger: ControlBarTrigger,
  Portal: ControlBarPortal,
  Overlay: ControlBarOverlay,
  Content: ControlBarContent,
  Title: ControlBarTitle,
};

export type {
  ControlBarContentProps,
  ControlBarContentRenderProps,
} from "./content/control-bar-content";
export type { ControlBarOverlayProps } from "./overlay/control-bar-overlay";
export type { ControlBarPortalProps } from "./portal/control-bar-portal";
export type {
  ControlBarRootProps,
  ControlBarRootRenderProps,
} from "./root/control-bar-root";
export type { ControlBarRootContextValue } from "./root/control-bar-root-context";
export type { ControlBarTitleProps } from "./title/control-bar-title";
export type {
  ControlBarTriggerProps,
  ControlBarTriggerRenderProps,
} from "./trigger/control-bar-trigger";

export { ControlBar };
