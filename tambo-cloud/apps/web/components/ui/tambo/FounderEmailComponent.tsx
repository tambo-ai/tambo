"use client";

import {
  useTamboComponentState,
  useTamboStreamingProps,
} from "@tambo-ai/react";
import { z } from "zod";
import { Button } from "../button";
import { Input } from "../input";
import { Textarea } from "../textarea";

// Define the component props and state types
export const FounderEmailProps = z
  .object({
    aiGeneratedSubject: z
      .string()
      .optional()
      .default("")
      .describe(
        "By default, generate the subject of the email, example: Hello from your demo app.",
      ),
    aiGeneratedBody: z
      .string()
      .optional()
      .default("")
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
interface EmailState {
  subject: string;
  body: string;
  usersEmail: string;
  isSent: boolean;
  isLoading: boolean;
  error: string | null;
}

export const FounderEmailComponent = ({
  aiGeneratedSubject = "",
  aiGeneratedBody = "",
  usersEmail = "",
}: FounderEmailProps) => {
  // Use Tambo's state management hook with a unique key
  const [emailState, setEmailState] = useTamboComponentState<EmailState>(
    "founder-email-state",
    {
      subject: "",
      body: "",
      usersEmail: "",
      isSent: false,
      isLoading: false,
      error: null,
    },
  );

  // Use Tambo's streaming props hook to handle prop updates
  useTamboStreamingProps(emailState, setEmailState, {
    subject: aiGeneratedSubject,
    body: aiGeneratedBody,
    usersEmail: usersEmail,
  });

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      // Update state to show success
      setEmailState({
        ...emailState,
        isSent: true,
        isLoading: false,
      });
    } catch (error) {
      // Update state to show error
      setEmailState({
        ...emailState,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // If the state hasn't loaded yet, show a loading state
  if (!emailState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="founder-email-component p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Email the Founders</h2>

      {emailState.isSent ? (
        <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
          <p className="font-medium">Email sent successfully!</p>
          <p className="text-sm mt-1">
            Thanks for trying our demo! We read every email and will get back to
            you as soon as possible.
          </p>
        </div>
      ) : (
        <form className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Subject
            </label>
            <Input
              id="subject"
              value={emailState.subject}
              onChange={handleSubjectChange}
              disabled={emailState.isLoading}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Message
            </label>
            <Textarea
              id="body"
              value={emailState.body}
              onChange={handleBodyChange}
              rows={6}
              disabled={emailState.isLoading}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Enter Your Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={emailState.usersEmail}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              disabled={emailState.isLoading}
              className="w-full"
              required
            />
          </div>

          {emailState.error && (
            <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm">
              <p>Please enter a valid email address.</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendEmail}
            disabled={
              emailState.isLoading || !emailState.subject || !emailState.body
            }
            className="w-full"
          >
            {emailState.isLoading ? "Sending..." : "Send Email to Founders"}
          </Button>
        </form>
      )}
    </div>
  );
};
