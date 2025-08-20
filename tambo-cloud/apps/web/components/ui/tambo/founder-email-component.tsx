"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "../button";
import { Input } from "../input";
import { Textarea } from "../textarea";

// Define the component props and state types
export const FounderEmailProps = z
  .object({
    aiGeneratedSubject: z
      .string()
      .describe(
        "By default, generate the subject of the email, example: Hello from your demo app.",
      ),
    aiGeneratedBody: z
      .string()
      .describe(
        "By default, generate the body of the email, example: I generated this email using your demo app.",
      ),
    usersEmail: z
      .string()
      .optional()
      .default("")
      .describe(
        "The user's email address. Do not include the user's email address unless they provide it. Do Not Make Up An Email Address.",
      ),
  })
  .describe(
    "Write a genz style email. Example content: hey i'm testing your app on your demo page and want to learn more.",
  );

type FounderEmailProps = z.infer<typeof FounderEmailProps>;

const sendEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  usersEmail: z.string().email("Please enter a valid email address"),
});

interface ValidationError {
  message: string;
  details?: {
    reason?: string;
    technical_details?: Record<string, any>;
  };
}

interface EmailState {
  subject: string;
  body: string;
  usersEmail: string;
  isSent: boolean;
  isLoading: boolean;
  error: ValidationError | null;
}

export const FounderEmailComponent = ({
  aiGeneratedSubject = "",
  aiGeneratedBody = "",
  usersEmail = "",
}: FounderEmailProps) => {
  const [emailState, setEmailState] = useState<EmailState>({
    subject: aiGeneratedSubject,
    body: aiGeneratedBody,
    usersEmail: usersEmail,
    isSent: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    setEmailState((prevState) => {
      // Only update if not currently loading and not already sent
      if (prevState.isLoading || prevState.isSent) {
        return prevState;
      }

      return {
        subject: aiGeneratedSubject,
        body: aiGeneratedBody,
        usersEmail: usersEmail,
        isSent: false,
        isLoading: false,
        error: null,
      };
    });
  }, [aiGeneratedSubject, aiGeneratedBody, usersEmail]);

  // Update the Tambo state when input changes
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value;

    // Update the Tambo state (this is persisted)
    if (emailState) {
      setEmailState({
        ...emailState,
        subject: newSubject,
      });
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    // Update the Tambo state (this is persisted)
    if (emailState) {
      setEmailState({
        ...emailState,
        body: newBody,
      });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    if (emailState) {
      setEmailState({
        ...emailState,
        usersEmail: newEmail,
      });
    }
  };

  // Handle sending the email
  const handleSendEmail = async () => {
    if (!emailState) return;

    try {
      // Validate the email data before sending
      const validatedData = sendEmailSchema.parse({
        subject: emailState.subject,
        body: emailState.body,
        usersEmail: emailState.usersEmail,
      });

      // Update state to show loading
      setEmailState({
        ...emailState,
        isLoading: true,
        error: null,
      });

      // Here you would integrate with Resend API
      const response = await fetch("/api/send-founder-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationError: ValidationError = {
          message: data.message || data.error || "Failed to send email",
          details: data.details || {},
        };
        throw validationError;
      }

      // Update state to show success
      setEmailState({
        ...emailState,
        isSent: true,
        isLoading: false,
      });
    } catch (error) {
      // Update state to show error
      const validationError: ValidationError = {
        message:
          (error as ValidationError).message ||
          (error instanceof Error ? error.message : "Failed to send email"),
        details: (error as ValidationError).details || {},
      };

      setEmailState({
        ...emailState,
        isLoading: false,
        error: validationError,
      });
    }
  };

  // If the state hasn't loaded yet, show a loading state
  if (!emailState) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="founder-email-component p-4 border rounded-lg shadow-sm max-w-md"
      data-tambo-email-form
    >
      <h2 className="text-lg font-semibold mb-3">Email the Founders</h2>

      {emailState.isSent ? (
        <div className="bg-green-50 p-3 rounded-md text-green-700 mb-3">
          <p className="font-medium text-sm">Email sent successfully!</p>
          <p className="text-xs mt-1">
            Thanks for trying our demo! We read every email and will get back to
            you as soon as possible.
          </p>
        </div>
      ) : (
        <form className="space-y-3">
          <div>
            <label htmlFor="subject" className="block text-xs font-medium mb-1">
              Subject
            </label>
            <Input
              id="subject"
              value={emailState?.subject || ""}
              onChange={handleSubjectChange}
              disabled={emailState?.isLoading}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-xs font-medium mb-1">
              Message
            </label>
            <Textarea
              id="body"
              value={emailState?.body || ""}
              onChange={handleBodyChange}
              rows={2}
              disabled={emailState?.isLoading}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1">
              Enter Your Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={emailState?.usersEmail || ""}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              disabled={emailState?.isLoading}
              className="w-full text-sm"
              required
            />
          </div>

          {emailState.error && (
            <div className="bg-red-50 p-3 rounded-md text-red-700">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-2">
                  <h3 className="text-xs font-medium text-red-800">
                    Email Invalid
                  </h3>
                  <div className="mt-1 text-xs text-red-700">
                    {emailState.error.details?.reason ? (
                      <p>
                        {emailState.error.details.reason === "smtp"
                          ? "We couldn't verify if this email can receive messages. Please double-check the address."
                          : emailState.error.details.reason === "disposable"
                            ? "Please use your regular email address instead of a temporary one."
                            : emailState.error.details.reason === "typo"
                              ? "There might be a typo in your email address. Please check the spelling."
                              : emailState.error.details.reason === "mx"
                                ? "The email domain appears to be invalid or cannot receive emails."
                                : emailState.error.message}
                      </p>
                    ) : (
                      <p>{emailState.error.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendEmail}
            disabled={
              emailState.isLoading || !emailState.subject || !emailState.body
            }
            className="w-full text-sm"
          >
            {emailState.isLoading ? "Sending..." : "Send Email to Founders"}
          </Button>
        </form>
      )}
    </div>
  );
};
