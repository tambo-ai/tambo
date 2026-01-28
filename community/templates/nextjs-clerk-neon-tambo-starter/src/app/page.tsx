"use client";

import { TamboChat } from "@/components/tambo/tambo-chat";
import { tools } from "@/lib/tambo";
import { UserButton } from "@clerk/nextjs";
import { TamboProvider } from "@tambo-ai/react";

export default function HomePage() {
    const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

    if (!apiKey) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">
                        Configuration Error
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        NEXT_PUBLIC_TAMBO_API_KEY is not set
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="h-screen flex flex-col">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Tambo Notes
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    AI-Powered Note Taking
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                                Powered by Clerk + Neon + Tambo
                            </div>
                            <UserButton
                                afterSignOutUrl="/sign-in"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-10 h-10"
                                    }
                                }}
                            />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden">
                    <div className="max-w-5xl mx-auto h-full py-6 px-4 sm:px-6 lg:px-8">
                        <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <TamboProvider apiKey={apiKey} tools={tools}>
                                <TamboChat />
                            </TamboProvider>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
