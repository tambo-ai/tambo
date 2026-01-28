interface Task {
  id: string;
  title: string;
  status: string;
}

export const TaskList = ({ tasks }: { tasks: Task[] }) => {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-2 bg-zinc-800 rounded">
          <span className="text-sm">{task.title}</span>
          <span className="text-xs text-zinc-400">{task.status}</span>
        </div>
      ))}
    </div>
  );
};