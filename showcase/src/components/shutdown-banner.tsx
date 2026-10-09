const linkClassName = "font-medium underline underline-offset-4";

/**
 * Site-wide notice that Tambo Cloud is shutting down.
 * @returns The shutdown banner element.
 */
export function ShutdownBanner() {
  return (
    <aside
      aria-label="Tambo Cloud shutdown notice"
      className="w-full border-b border-border bg-muted px-4 py-2 text-center text-sm text-foreground"
    >
      <p>
        <strong>Tambo Cloud is shutting down.</strong> New signups are closed,
        and the hosted API stops responding after October 31, 2026.{" "}
        <a
          href="https://tambo.co/blog/posts/tambo-is-shutting-down"
          className={linkClassName}
        >
          Read the announcement
        </a>{" "}
        or{" "}
        <a
          href="https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md"
          className={linkClassName}
        >
          self-host Tambo
        </a>
        . The team is now building{" "}
        <a href="https://usecharming.com" className={linkClassName}>
          Charming
        </a>
        , a collaborative cloud for apps built with any AI agent.
      </p>
    </aside>
  );
}
