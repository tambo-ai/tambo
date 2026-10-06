import {
  CHARMING_DESCRIPTION,
  CHARMING_URL,
  SELF_HOSTING_URL,
  SHUTDOWN_ANNOUNCEMENT_URL,
} from "@/lib/shutdown";
import { Banner } from "fumadocs-ui/components/banner";

const linkClassName = "underline underline-offset-4 hover:text-fd-foreground";

/**
 * Site-wide notice that Tambo Cloud is shutting down.
 * Rendered in normal document flow (not sticky) so it does not overlap the sticky header bar.
 * @returns The shutdown banner element.
 */
export function ShutdownBanner() {
  return (
    <Banner
      changeLayout={false}
      height="auto"
      className="relative py-2 text-fd-foreground"
    >
      <p>
        <strong>Tambo Cloud is shutting down.</strong> New signups are closed,
        and the hosted API stops responding after October 31, 2026.{" "}
        <a href={SHUTDOWN_ANNOUNCEMENT_URL} className={linkClassName}>
          Read the announcement
        </a>{" "}
        or{" "}
        <a href={SELF_HOSTING_URL} className={linkClassName}>
          self-host Tambo
        </a>
        . The team is now building{" "}
        <a href={CHARMING_URL} className={linkClassName}>
          Charming
        </a>
        , {CHARMING_DESCRIPTION}.
      </p>
    </Banner>
  );
}
