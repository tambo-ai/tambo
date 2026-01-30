import Link from "next/link";
import { getThreads } from "./actions/thread";

export default async function Home() {
  const threads = await getThreads();

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-3xl px-6 py-12 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tambo + Prisma Starter
          </h1>
          <p className="text-neutral-600 leading-relaxed">
            A minimal Next.js template demonstrating how to use{" "}
            <strong>Tambo</strong> with a database-backed tool layer powered by{" "}
            <strong>Prisma</strong>.
          </p>
        </header>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Open AI Chat
          </Link>
        </div>

        {/* Threads (light, non-primary) */}
        {threads.length > 0 && (
          <section className="pt-6 border-t border-neutral-200">
            <h2 className="text-sm font-medium text-neutral-700 mb-3">
              Existing Threads
            </h2>
            <ul className="space-y-2">
              {threads.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 bg-white"
                >
                  {t.title ?? "Untitled thread"}{" "}
                  <span className="text-neutral-400">
                    · {new Date(t.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
