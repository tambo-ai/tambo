"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/trpc/react";
import { REFERRAL_SOURCES, type ReferralSource } from "@tambo-ai-cloud/core";
import { useId, useRef, useState } from "react";

export function TamboReferralQuestion() {
  const id = useId();
  const [source, setSource] = useState<ReferralSource | "">("");
  const hasSubmitted = useRef(false);
  const mutation = api.user.saveReferralSource.useMutation();

  return (
    <details className="rounded-md border border-border p-4">
      <summary className="cursor-pointer rounded-sm text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        How did you hear about us? (optional)
      </summary>
      <form
        className="flex flex-col gap-4 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (source && !hasSubmitted.current) {
            // Keep the write-once answer guarded before pending state renders.
            hasSubmitted.current = true;
            mutation.mutate(
              { source },
              {
                onError: () => {
                  hasSubmitted.current = false;
                },
              },
            );
          }
        }}
      >
        <RadioGroup
          aria-label="How did you hear about us?"
          value={source}
          disabled={mutation.isPending || mutation.isSuccess}
          onValueChange={(value) => {
            const choice = REFERRAL_SOURCES.find((item) => item === value);
            if (choice) setSource(choice);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {REFERRAL_SOURCES.map((choice, index) => (
            <label
              key={choice}
              htmlFor={`${id}-${index}`}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <RadioGroupItem value={choice} id={`${id}-${index}`} />
              {choice}
            </label>
          ))}
        </RadioGroup>
        {mutation.isSuccess ? (
          <p role="status" className="text-sm text-foreground">
            Thanks for letting us know.
          </p>
        ) : (
          <Button
            type="submit"
            variant="outline"
            className="self-start"
            disabled={!source || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save answer"}
          </Button>
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            We couldn&apos;t save your answer. You can try again or continue
            creating your project.
          </p>
        )}
      </form>
    </details>
  );
}
