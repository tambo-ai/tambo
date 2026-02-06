import * as React from "react";
import { createPortal } from "react-dom";
import { useControlBarRootContext } from "../root/control-bar-root-context";

export interface ControlBarPortalProps {
  /** The container element to portal into. Defaults to document.body. */
  container?: Element | DocumentFragment | null;
  /** Children to render inside the portal. */
  children?: React.ReactNode;
}

/**
 * Portal primitive for the control bar.
 * Renders children into a portal only when the dialog is open.
 * @returns A React portal containing children, or null when closed.
 */
export function ControlBarPortal({
  container,
  children,
}: ControlBarPortalProps) {
  const { isOpen } = useControlBarRootContext();

  if (!isOpen) {
    return null;
  }

  const portalContainer =
    container ?? (typeof document !== "undefined" ? document.body : null);

  if (!portalContainer) {
    return null;
  }

  return createPortal(children, portalContainer);
}
ControlBarPortal.displayName = "ControlBar.Portal";
