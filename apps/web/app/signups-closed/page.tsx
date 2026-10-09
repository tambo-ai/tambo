import { buttonVariants } from "@/components/ui/button";
import { isTamboCloud, SHUTDOWN_CONFIG } from "@/lib/shutdown-config";
import type { Metadata } from "next";
import Link from "next/link";
import type { FC } from "react";

export const metadata: Metadata = {
  title: "Signups closed",
  description: "New signups are closed.",
  robots: {
    index: false,
    follow: true,
  },
};

const inlineLinkClassName =
  "text-foreground underline underline-offset-2 hover:text-primary";

export default function SignupsClosedPage() {
  const isCloud = isTamboCloud();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-center">
      <h1 className="font-heading text-3xl font-semibold md:text-4xl">
        New signups are closed
      </h1>
      <div className="flex max-w-xl flex-col gap-4 text-muted-foreground">
        {isCloud && <ShutdownSummary />}
        <p>
          We couldn&apos;t find an existing account for the provider or email
          you signed in with, so we didn&apos;t create a new one. If you already
          have an account, sign in with the same provider or email you used
          before.
        </p>
        {isCloud && <ShutdownAlternatives />}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isCloud && <ShutdownActions />}
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

const ShutdownSummary: FC = () => (
  <p>
    Tambo Cloud is shutting down. It keeps running for existing accounts until{" "}
    {SHUTDOWN_CONFIG.SERVICE_END_DATE}, after which the API stops responding.
    All user data is deleted on {SHUTDOWN_CONFIG.DATA_DELETION_DATE}.
  </p>
);

const ShutdownAlternatives: FC = () => (
  <>
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
  </>
);

const ShutdownActions: FC = () => (
  <>
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
  </>
);
