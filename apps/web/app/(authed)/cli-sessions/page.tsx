import { CliSessionsList } from "@/components/cli-sessions/cli-sessions-list";

export default function CliSessionsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">CLI Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage devices that have access to your tambo account via the CLI.
        </p>
      </div>
      <CliSessionsList />
    </div>
  );
}
