"use client";

import { Card } from "@/components/ui/card";
import { z } from "zod";
import QuoteForm from "@/components/resuable/quote-form";
import { QuoteProps } from "@/components/resuable/zod-types";

export default function QuoteCard({
  props,
}: {
  props: z.infer<typeof QuoteProps>;
}) {
  return (
    <section className="lg:py-18 flex items-center justify-center bg-green-800 py-12 md:py-16">
      <Card className="m-4 w-full max-w-lg">
        <div className="p-4">
          <h2 className="text-center text-xl font-bold">{props.cardTitle}</h2>
          <p className="mb-4 text-center text-gray-600">
            {props.cardDescription}
          </p>
          <QuoteForm
            props={{
              services: props.services,
              successMessage: props.successMessage,
              errorMessage: props.errorMessage,
              successTitle: props.successTitle,
              errorTitle: props.errorTitle,
            }}
          />
        </div>
      </Card>
    </section>
  );
}
