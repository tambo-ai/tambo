import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";

const HowItWorksSection = () => (
  <div className="bg-white px-8 py-6 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">How this template works</h2>

    <ol className="space-y-3 text-gray-600 list-decimal list-inside">
      <li>
        You sign in using <strong>Supabase Auth</strong> (email magic link).
      </li>
      <li>
        You describe an email in natural language inside the chat.
      </li>
      <li>
        Tambo generates an <strong>EmailPreview</strong> component showing the draft.
      </li>
      <li>
        Drafts are automatically <strong>saved to the database</strong>.
      </li>
      <li>
        When you send an email, it is delivered via <strong>Resend</strong> and
        persisted as <strong>sent</strong>.
      </li>
    </ol>

    <div className="mt-6 text-sm text-gray-500">
      This starter demonstrates <strong>AI-controlled UI</strong>,{" "}
      <strong>authentication</strong>, and{" "}
      <strong>real-world side effects</strong> backed by a database.
    </div>
  </div>
);

const KeyFilesSection = () => (
  <div className="bg-white px-8 py-6 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Key files to explore</h2>

    <ul className="space-y-4 text-gray-600">
      <li>
        <code className="font-mono font-medium">src/lib/tambo.ts</code>
        <div className="text-sm">
          Registers AI tools and components (EmailPreview, send & persist).
        </div>
      </li>

      <li>
        <code className="font-mono font-medium">
          src/components/tambo/EmailPreview.tsx
        </code>
        <div className="text-sm">
          AI-controlled component for reviewing emails before sending.
        </div>
      </li>

      <li>
        <code className="font-mono font-medium">
          src/services/send-email-and-persist.ts
        </code>
        <div className="text-sm">
          Sends email via Resend and stores it in Postgres.
        </div>
      </li>

      <li>
        <code className="font-mono font-medium">
          src/components/auth/AuthGate.tsx
        </code>
        <div className="text-sm">
          Protects the app and ties emails to authenticated users.
        </div>
      </li>

      <li>
        <code className="font-mono font-medium">
          src/app/chat/page.tsx
        </code>
        <div className="text-sm">
          Authenticated chat interface powered by Tambo.
        </div>
      </li>

      <li>
        <code className="font-mono font-medium">README.md</code>
        <div className="text-sm">
          Setup instructions for Supabase, Resend, and Tambo.
        </div>
      </li>
    </ul>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank" rel="noopener noreferrer">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo AI Logo"
              width={80}
              height={80}
              className="mb-4"
            />
          </a>

          <h1 className="text-4xl text-center">
            AI Email Assistant Starter
          </h1>

          <p className="text-gray-600 text-center mt-2">
            Authenticated, persistent, AI-powered email workflows.
          </p>
        </div>

        <div className="bg-white px-8 py-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Get started</h2>

          <ApiKeyCheck>
            <div className="flex flex-col gap-3">
              <a
                href="/chat"
                className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800 text-center"
              >
                 Open Chat →
              </a>

              <div className="text-sm text-gray-500 text-center">
                Try:{" "}
                <code>
                  Draft a professional follow-up email and save it as a draft
                </code>
              </div>
            </div>
          </ApiKeyCheck>
        </div>

        <HowItWorksSection />
        <KeyFilesSection />
      </main>
    </div>
  );
}
