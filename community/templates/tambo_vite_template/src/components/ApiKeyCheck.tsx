import type { ReactNode } from "react";

type ApiKeyCheckProps = {
  children: ReactNode;
};

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="border border-red-300 bg-red-50 text-red-800 rounded-md p-4">
        <h3 className="font-semibold mb-2">Tambo API key missing</h3>

        <p className="text-sm mb-3">
          You need a Tambo API key to use this app.
        </p>

        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Go to <a
            href="https://tambo.co/dashboard"
            target="_blank"
            className="underline"
          >tambo.co/dashboard</a></li>
          <li>Create a project</li>
          <li>Copy your API key</li>
          <li>
            Add it to <code className="bg-red-100 px-1 rounded">.env</code>:
          </li>
        </ol>

        <pre className="mt-3 bg-red-100 p-2 rounded text-xs overflow-auto">
VITE_TAMBO_API_KEY=your_api_key_here
        </pre>

        <p className="text-xs mt-2 opacity-80">
          Restart the dev server after adding the key.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
