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

interface LinearIssueListProps {
  readonly issues?: LinearIssueInfo[];
  readonly onIssueClick?: (issueId: string) => void;
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

export const LinearIssueList = ({
  issues,
  onIssueClick,
}: LinearIssueListProps): ReactNode => {
  if (!issues) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading issues...</p>
      </Card>
    );
  }

  if (issues.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">No issues found</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y">
      {issues.map((issue, index) => (
        <div
          key={issue.id ?? index}
          className="p-4 hover:bg-muted/50 cursor-pointer"
          onClick={() => issue.id && onIssueClick?.(issue.id)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-muted-foreground">
                  {issue.identifier}
                </span>
                {issue.priority !== undefined && (
                  <Badge
                    className={
                      priorityColors[
                        issue.priority as keyof typeof priorityColors
                      ]
                    }
                  >
                    {
                      priorityLabels[
                        issue.priority as keyof typeof priorityLabels
                      ]
                    }
                  </Badge>
                )}
                {issue.status?.name && (
                  <Badge variant="outline">{issue.status.name}</Badge>
                )}
              </div>
              <h3 className="text-sm font-medium truncate">
                {issue.url ? (
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {issue.title}
                  </a>
                ) : (
                  issue.title
                )}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {issue.assignee?.name && (
                <span className="whitespace-nowrap">{issue.assignee.name}</span>
              )}
              {issue.dueDate && (
                <span className="whitespace-nowrap">
                  Due: {new Date(issue.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {issue.labels && issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {issue.labels.map((label, labelIndex) => (
                <Badge
                  key={labelIndex}
                  variant="outline"
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
          )}
        </div>
      ))}
    </Card>
  );
};
