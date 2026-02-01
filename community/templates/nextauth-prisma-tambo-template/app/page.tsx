import { ApiKeyCheck } from "@/components/Apikeycheck";
import Image from "next/image";

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
            tambo + nextauth + prisma Template
          </h1>
        </div>

        <div className="w-full space-y-8">
          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>
            <ApiKeyCheck>
              <div className="flex gap-4 flex-wrap">
                <a
                  href="/login"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800"
                >
                  Go to Dashboard →
                </a>
              </div>
            </ApiKeyCheck>
          </div>

          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">How it works:</h2>
            <p className="text-gray-600 mb-4">
              This template demonstrates the basic flow of NextAuth and Prisma
              using Tambo AI for intelligent ticket management.
            </p>
            <p className="text-gray-600 mb-4">
              Sign in with your credentials to access the tickets dashboard,
              where you can create and manage user-based support tickets with
              the help of the Tambo AI assistant.
            </p>
            <div className="flex gap-4 flex-wrap mt-4">
              <a
                href="https://tambo.co/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
              >
                View Docs
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
