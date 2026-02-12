"use client";

interface SchemaProperty {
  type?: string;
  description?: string;
}

interface SchemaViewerProps {
  schema: Record<string, unknown> | undefined;
  label?: string;
}

/**
 * Renders a JSON Schema as a readable property list.
 * Falls back to raw JSON for non-object schemas.
 *
 * @returns A property table or raw JSON view of the schema.
 */
export function SchemaViewer({ schema, label }: SchemaViewerProps) {
  if (!schema || Object.keys(schema).length === 0) {
    return <p className="text-sm text-muted-foreground">No schema</p>;
  }

  const properties = schema.properties as
    | Record<string, SchemaProperty>
    | undefined;
  const required = (schema.required as string[]) ?? [];

  if (!properties) {
    return (
      <pre className="rounded-md bg-muted p-3 font-mono text-xs">
        {JSON.stringify(schema, null, 2)}
      </pre>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <div className="rounded-md border text-sm">
        {Object.entries(properties).map(([name, prop]) => (
          <div
            key={name}
            className="flex items-baseline gap-3 border-b px-3 py-1.5 last:border-b-0"
          >
            <span className="font-mono font-medium">{name}</span>
            {prop.type && (
              <span className="text-xs text-muted-foreground">{prop.type}</span>
            )}
            {required.includes(name) && (
              <span className="text-xs text-destructive">required</span>
            )}
            {prop.description && (
              <span className="text-xs text-muted-foreground">
                {prop.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
