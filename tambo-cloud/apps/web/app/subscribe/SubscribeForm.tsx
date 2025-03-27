"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useTamboComponentState,
  useTamboStreamingProps,
} from "@tambo-ai/react";
import { z } from "zod";

// Schema with descriptions to help Tambo understand the component
export const SubscribeFormProps = z.object({
  firstName: z
    .string()
    .optional()
    .default("")
    .describe("First name of the subscriber"),
  lastName: z
    .string()
    .optional()
    .default("")
    .describe("Last name of the subscriber"),
  title: z
    .string()
    .optional()
    .default("")
    .describe("Job title of the subscriber"),
  email: z
    .string()
    .optional()
    .default("")
    .describe("Email address of the subscriber"),
});

export type FormDataTambo = z.infer<typeof SubscribeFormProps>;

interface ValidationError {
  message: string;
  details?: {
    reason?: string;
    technical_details?: Record<string, any>;
  };
}

interface SubscribeFormState {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  isSubmitting: boolean;
  success: boolean;
  message: string | null;
  error: ValidationError | null;
}

export function SubscribeForm({
  firstName = "",
  lastName = "",
  title = "",
  email = "",
}: FormDataTambo) {
  // Use Tambo's state management hook with a unique key
  const [formState, setFormState] = useTamboComponentState<SubscribeFormState>(
    "subscribe-form-state",
    {
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      isSubmitting: false,
      success: false,
      message: null,
      error: null,
    },
  );

  // Use Tambo's streaming props hook to handle prop updates
  useTamboStreamingProps(formState, setFormState, {
    firstName,
    lastName,
    title,
    email,
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (formState) {
      setFormState({
        ...formState,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState) return;

    setFormState({
      ...formState,
      isSubmitting: true,
      success: false,
      message: null,
      error: null,
    });

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formState.firstName,
          lastName: formState.lastName,
          title: formState.title,
          email: formState.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const validationError: ValidationError = {
          message: data.message || data.error || "Failed to subscribe",
          details: data.details,
        };
        throw validationError;
      }

      // Clear any previous errors and set success state
      setFormState({
        ...formState,
        isSubmitting: false,
        success: true,
        message:
          data.message || "Thank you for subscribing! We'll be in touch soon.",
        error: null, // Explicitly clear any previous errors
      });
    } catch (error) {
      console.error("Subscription error:", error);
      const validationError: ValidationError = {
        message:
          (error as ValidationError)?.message ||
          (error instanceof Error
            ? error.message
            : "Failed to process subscription. Please try again."),
        details: (error as ValidationError)?.details || {},
      };

      // Clear success state and set error
      setFormState({
        ...formState,
        isSubmitting: false,
        success: false,
        message: null, // Clear any previous success message
        error: validationError,
      });
    }
  };

  // If the state hasn't loaded yet, show a loading state
  if (!formState) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formState.firstName}
          onChange={handleChange}
          required
          disabled={formState.isSubmitting || formState.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          value={formState.lastName}
          onChange={handleChange}
          disabled={formState.isSubmitting || formState.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
          disabled={formState.isSubmitting || formState.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          required
          disabled={formState.isSubmitting || formState.success}
          className="mt-1"
        />
      </div>

      {formState.error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Subscription Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {formState.error.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {formState.success ? (
        <div className="rounded bg-green-50 p-4 text-sm text-green-600">
          {formState.message}
        </div>
      ) : (
        <Button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full"
        >
          {formState.isSubmitting ? "Subscribing..." : "Subscribe"}
        </Button>
      )}
    </form>
  );
}
