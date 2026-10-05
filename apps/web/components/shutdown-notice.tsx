import { ShutdownBanner } from "@/components/shutdown-banner";
import { isTamboCloud } from "@/lib/shutdown-config";
import type { FC } from "react";

/**
 * Render the shutdown banner automatically on managed Tambo Cloud hosts.
 * @returns The shutdown banner, or null for self-hosted deployments
 */
export const ShutdownNotice: FC = () => {
  if (!isTamboCloud()) {
    return null;
  }
  return <ShutdownBanner />;
};
