export default function TaskList({
  tasks = [],
}: {
  tasks?: Array<{ id: string; title: string }>;
}) {
  const list = tasks ?? [];
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <p className="mb-2 font-semibold">📋 Tasks</p>
      <ul className="space-y-2">
        {list.map((t, i) => (
          <li
            key={t.id || `task-${i}`}
            className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2 text-sm"
          >
            ✅ {t.title ?? ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
