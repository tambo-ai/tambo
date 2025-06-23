import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface LinearIssueInfo {
  id?: string;
  identifier?: string;
  title?: string;
  description?: string;
  priority?: number;
  url?: string;
  status?: {
    name?: string;
    type?: string;
  };
  assignee?: {
    name?: string;
    email?: string;
  };
  labels?: Array<{
    name: string;
    color?: string;
  }>;
  createdAt?: string;
  dueDate?: string;
}

interface LinearIssueProps {
  readonly data?: LinearIssueInfo;
}

const priorityLabels = {
  0: "No Priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

const priorityColors = {
  0: "bg-gray-200 text-gray-700",
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-blue-100 text-blue-700",
  4: "bg-green-100 text-green-700",
};

export const LinearIssue = ({ data }: LinearIssueProps): ReactNode => {
  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading issue data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono text-muted-foreground">
              {data.identifier}
            </span>
            {data.priority !== undefined && (
              <Badge
                className={
                  priorityColors[data.priority as keyof typeof priorityColors]
                }
              >
                {priorityLabels[data.priority as keyof typeof priorityLabels]}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-medium mb-2">
            {data.url ? (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary"
              >
                {data.title}
              </a>
            ) : (
              data.title
            )}
          </h3>
          {data.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <p className="text-muted-foreground">Status</p>
          <p>{data.status?.name ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Assignee</p>
          <p>{data.assignee?.name ?? "Unassigned"}</p>
        </div>
        {data.dueDate && (
          <div>
            <p className="text-muted-foreground">Due Date</p>
            <p>{new Date(data.dueDate).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Created</p>
          <p>
            {data.createdAt
              ? new Date(data.createdAt).toLocaleDateString()
              : "Unknown"}
          </p>
        </div>
      </div>

      {data.labels && data.labels.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Labels</p>
          <div className="flex flex-wrap gap-2">
            {data.labels.map((label, index) => (
              <Badge
                key={index}
                style={{
                  backgroundColor: label.color
                    ? `${label.color}20`
                    : "var(--background)",
                  color: label.color ?? "var(--foreground)",
                  border: "1px solid",
                  borderColor: label.color ?? "var(--border)",
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
