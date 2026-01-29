type Task = {
  id: string;
  title: string;
  createdAt: string;
};

export default function TaskList({ tasks }: { tasks: any[] }) {
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
      <p className="font-semibold mb-2">📋 Tasks</p>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 bg-slate-700 px-2 py-1 rounded"
          >
            ✅ {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

