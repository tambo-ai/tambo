"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { type FC, type ReactNode, useEffect, useId, useRef } from "react";
import type { TamboGettingStartedState } from "./getting-started-state";
import { TamboSetupCommand } from "./setup-command";
import { TamboSetupProjectForm } from "./setup-project-form";

interface TamboGettingStartedGuideProps {
  state: TamboGettingStartedState;
  onCreateProject: (name: string) => void;
  onRetryLoad: () => void;
  referralQuestion?: ReactNode;
}

export const TamboGettingStartedGuide: FC<TamboGettingStartedGuideProps> = ({
  state,
  onCreateProject,
  onRetryLoad,
  referralQuestion,
}) => {
  const titleId = useId();
  const nextStepRef = useRef<HTMLHeadingElement>(null);
  const previousStatus = useRef(state.status);

  useEffect(() => {
    if (
      previousStatus.current === "needs-project" &&
      state.status === "project-created"
    ) {
      nextStepRef.current?.focus();
    }
    previousStatus.current = state.status;
  }, [state.status]);

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      className="mx-auto min-w-0 max-w-3xl break-words"
    >
      <CardHeader className="gap-4">
        <Badge variant="outline" className="w-fit">
          Getting started
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 id={titleId} className="font-heading text-3xl">
            Build your first AI app
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground">
            Create a project, then connect a local app with the Tambo starter.
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {state.status === "error" && (
          <div className="flex flex-col gap-4">
            <p role="alert">We couldn&apos;t load your projects.</p>
            <Button
              variant="outline"
              className="self-start"
              onClick={onRetryLoad}
            >
              Try again
            </Button>
          </div>
        )}
        {state.status === "needs-project" && (
          <div className="flex max-w-lg flex-col gap-4">
            <h2 className="text-lg font-medium">Create your first project</h2>
            <p className="text-sm leading-relaxed text-foreground">
              A project keeps your app&apos;s API keys, settings, and
              conversations together.
            </p>
            <TamboSetupProjectForm
              creation={state.creation}
              onCreateProject={onCreateProject}
            />
            {referralQuestion}
          </div>
        )}
        {state.status === "project-created" && (
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2
                ref={nextStepRef}
                tabIndex={-1}
                className="text-lg font-medium"
              >
                Connect {state.project.name}
              </h2>
              <p role="status" className="text-sm text-foreground">
                Your project is created. Next, run your app locally.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Run the starter command in your terminal. Sign in and select{" "}
              <strong className="font-medium text-foreground">
                {state.project.name}
              </strong>{" "}
              when prompted. The CLI creates an API key and saves it in your
              app&apos;s environment file.
            </p>
            <TamboSetupCommand
              label="Create command"
              command="npm create tambo-app@latest my-tambo-app"
            />
            <TamboSetupCommand
              label="Run command"
              command={"cd my-tambo-app\nnpm run dev"}
            />
            <p className="text-sm leading-relaxed text-foreground">
              Open the address shown in your terminal and send a message in the
              app. You can view its conversations in your project dashboard.
            </p>
            <Button asChild className="self-start">
              <Link href={`/${state.project.id}`}>Open project dashboard</Link>
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-5 text-sm">
          <Link
            className="underline underline-offset-4"
            href="https://docs.tambo.co/getting-started/quickstart"
          >
            Read the starter quickstart
          </Link>
          <Link
            className="underline underline-offset-4"
            href="https://docs.tambo.co/getting-started/integrate"
          >
            Already have a React app?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
