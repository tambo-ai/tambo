import { buttonVariants } from "@/components/ui/button";
import { SHUTDOWN_CONFIG } from "@/lib/shutdown-config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Signups closed – Tambo Cloud",
  description:
    "Tambo Cloud is shutting down and no longer accepts new signups.",
  robots: {
    index: false,
    follow: true,
  },
};

const inlineLinkClassName =
  "text-foreground underline underline-offset-2 hover:text-primary";

export default function SignupsClosedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-center">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        New signups are closed
      </h1>
      <div className="flex max-w-xl flex-col gap-4 text-muted-foreground">
        <p>
          Tambo Cloud is shutting down. It keeps running for existing accounts
          until {SHUTDOWN_CONFIG.SERVICE_END_DATE}, after which the API stops
          responding. All user data is deleted on{" "}
          {SHUTDOWN_CONFIG.DATA_DELETION_DATE}.
        </p>
        <p>
          We couldn&apos;t find an existing Tambo Cloud account for the account
          you signed in with, so we didn&apos;t create a new one. If you already
          have an account, sign in with the same provider or email you used
          before.
        </p>
        <p>
          Tambo is open source, so you can still{" "}
          <a
            href={SHUTDOWN_CONFIG.URLS.SELF_HOSTING}
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLinkClassName}
          >
            self-host it
          </a>{" "}
          from the{" "}
          <a
            href={SHUTDOWN_CONFIG.URLS.GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLinkClassName}
          >
            GitHub repository
          </a>
          .
        </p>
        <p>
          The team is now building{" "}
          <a
            href={SHUTDOWN_CONFIG.URLS.CHARMING}
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLinkClassName}
          >
            Charming
          </a>
          , {SHUTDOWN_CONFIG.CHARMING_DESCRIPTION}.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={SHUTDOWN_CONFIG.URLS.ANNOUNCEMENT}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          Read the announcement
        </a>
        <a
          href={SHUTDOWN_CONFIG.URLS.CHARMING}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Try Charming
        </a>
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
