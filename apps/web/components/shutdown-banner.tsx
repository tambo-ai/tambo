import { SHUTDOWN_CONFIG } from "@/lib/shutdown-config";
import { cn } from "@/lib/utils";
import type { FC } from "react";

interface ShutdownBannerProps {
  isSignupClosed: boolean;
  className?: string;
}

const linkClassName =
  "font-medium underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

/**
 * Site-wide notice that Tambo Cloud is shutting down, and whether new signups
 * are closed.
 * @returns The shutdown banner
 */
export const ShutdownBanner: FC<ShutdownBannerProps> = ({
  isSignupClosed,
  className,
}) => (
  <aside
    aria-label="Tambo Cloud shutdown notice"
    className={cn(
      "w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900",
      className,
    )}
  >
    <p>
      Tambo Cloud is shutting down on {SHUTDOWN_CONFIG.SERVICE_END_DATE}.{" "}
      {isSignupClosed && "New signups are closed. "}
      <a
        href={SHUTDOWN_CONFIG.URLS.ANNOUNCEMENT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Read the announcement
      </a>
      <span aria-hidden="true"> · </span>
      <a
        href={SHUTDOWN_CONFIG.URLS.CHARMING}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        We&apos;re now building Charming
        <span aria-hidden="true"> →</span>
      </a>
    </p>
  </aside>
);
