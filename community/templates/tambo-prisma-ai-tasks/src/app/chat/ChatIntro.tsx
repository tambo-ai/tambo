export function ChatIntro() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        AI Task Assistant
      </h1>

      <p className="text-neutral-600">
        This chat demonstrates how <strong>Tambo</strong> can safely interact
        with a database using <strong>Prisma</strong>.
      </p>

      <div className="text-left bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-sm">
        <p className="font-medium text-neutral-800">Try asking things like:</p>
        <ul className="list-disc list-inside text-neutral-600 space-y-1">
          <li>Add a task called Fix login bug</li>
          <li>List all my tasks</li>
          <li>Rename task &lt;TASK_NAME&gt; to Fix auth bug</li>
          <li>Delete task &lt;TASK_NAME&gt;</li>
        </ul>
      </div>

      <p className="text-xs text-neutral-400">
        The AI will use database-backed tools — not guesses.
      </p>
    </div>
  );
}
