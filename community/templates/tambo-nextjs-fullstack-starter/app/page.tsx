"use client";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";
import { Instructions } from "@/components/Instructions";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank" rel="noopener noreferrer">
            <Image
              src="/logo/Octo-Icon.svg"
              alt="Tambo AI Logo"
              width={80}
              height={160}
              className="mb-6 mt-7"
            />
          </a>
          <h1 className="text-4xl text-center"> Nextjs Fullstack Template</h1>
        </div>

        <div className="w-full space-y-8">
          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>
            <ApiKeyCheck>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center justify-center">
                <Button
                  size="lg"
                  className="flex items-center px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800"
                  onClick={() =>
                    signIn("google", { callbackUrl: "/dashboard" })
                  }
                >
                  <span className="flex items-center gap-2">
                    <Image
                      src="/logo/google.svg"
                      alt="Google Logo"
                      width={24}
                      height={24}
                    />
                    Get Started
                  </span>
                </Button>
              </div>
            </ApiKeyCheck>
          </div>
          <Instructions />
        </div>
      </main>
    </div>
  );
}
