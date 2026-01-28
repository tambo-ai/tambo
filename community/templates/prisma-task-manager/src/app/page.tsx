import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-container to-background flex items-center justify-center">
      <div className="max-w-2xl w-full text-center p-8">

        {/* Logo / Title */}
        <h1 className="text-4xl font-bold mb-3">
          🤖 Tambo Prisma Starter
        </h1>

        <p className="text-muted-foreground text-lg mb-8">
          Build AI-powered task management apps using
          Tambo tools, Prisma, and interactive UI components.
        </p>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mb-10">
          <Link
            href="/chat"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            Open Chat
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            className="border border-border px-6 py-3 rounded-lg text-sm hover:bg-muted transition"
          >
            GitHub
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">

          <Feature title="💬 AI Chat">
            Natural language task management
          </Feature>

          <Feature title="🧠 Tools">
            Create, fetch and control data
          </Feature>

          <Feature title="🧱 UI Components">
            Render React components from AI
          </Feature>

          <Feature title="🗄 Prisma + SQLite">
            Persistent storage
          </Feature>

        </div>

      </div>
    </main>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
