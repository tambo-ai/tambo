"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { z } from "zod";

// Schema with descriptions to help Tambo understand the component
export const formSchemaTambo = z.object({
  firstName: z.string().optional().describe("First name of the subscriber"),
  lastName: z.string().optional().describe("Last name of the subscriber"),
  title: z.string().optional().describe("Job title of the subscriber"),
  email: z.string().optional().describe("Email address of the subscriber"),
});

export type FormDataTambo = z.infer<typeof formSchemaTambo>;

export function SubscribeForm(props: Partial<FormDataTambo>) {
  // Initialize form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
  });

  const [status, setStatus] = useState({
    isSubmitting: false,
    success: false,
    message: null as string | null,
    error: null as string | null,
  });

  // Update form data when props change
  useEffect(() => {
    if (Object.values(props).some((value) => value !== undefined)) {
      setFormData((prev) => ({
        ...prev,
        ...props,
      }));

      // Reset form status when props change
      setStatus((prev) => ({
        ...prev,
        success: false,
        error: null,
      }));
    }
  }, [props]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus({
      isSubmitting: true,
      success: false,
      message: null,
      error: null,
    });

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus({
        isSubmitting: false,
        success: true,
        message:
          data.message || "Thank you for subscribing! We'll be in touch soon.",
        error: null,
      });
    } catch (err) {
      setStatus({
        isSubmitting: false,
        success: false,
        message: null,
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          required
          disabled={status.isSubmitting || status.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          disabled={status.isSubmitting || status.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          disabled={status.isSubmitting || status.success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={status.isSubmitting || status.success}
          className="mt-1"
        />
      </div>

      {status.error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-500">
          {status.error}
        </div>
      )}

      {status.success ? (
        <div className="rounded bg-green-50 p-3 text-sm text-green-600">
          {status.message}
        </div>
      ) : (
        <Button type="submit" disabled={status.isSubmitting} className="w-full">
          {status.isSubmitting ? "Subscribing..." : "Subscribe"}
        </Button>
      )}
    </form>
  );
}
