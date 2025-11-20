import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortIcon } from "../../ui/sort-icon";
import { SortDirection, SortField } from "../hooks/useThreadList";

interface ThreadTableHeaderProps {
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  hasCurrentThreads: boolean;
  compact?: boolean;
}

export function ThreadTableHeader({
  currentField,
  direction,
  onSort,
  allSelected,
  onSelectAll,
  hasCurrentThreads,
  compact = false,
}: ThreadTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="text-sm font-medium w-4">
          <input
            type="checkbox"
            checked={hasCurrentThreads && allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-gray-300"
            aria-label={
              hasCurrentThreads && allSelected
                ? "Deselect all threads"
                : "Select all threads"
            }
          />
        </TableHead>
        <TableHead
          className="cursor-pointer text-sm font-medium px-4"
          onClick={() => onSort("created")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("created");
            }
          }}
          aria-label={`Sort by created date, currently ${
            currentField === "created"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            <span className="hidden sm:inline">Created</span>
            <span className="sm:hidden">Date</span>
            <SortIcon
              field="created"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className={`cursor-pointer text-sm font-medium px-4 ${
            compact ? "hidden" : "hidden lg:table-cell"
          }`}
          onClick={() => onSort("updated")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("updated");
            }
          }}
          aria-label={`Sort by updated date, currently ${
            currentField === "updated"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            Updated{" "}
            <SortIcon
              field="updated"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer text-sm font-medium px-4 hidden sm:table-cell"
          onClick={() => onSort("threadId")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("threadId");
            }
          }}
          aria-label={`Sort by thread ID, currently ${
            currentField === "threadId"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            Thread ID{" "}
            <SortIcon
              field="threadId"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className={`cursor-pointer text-sm font-medium px-4 ${
            compact ? "hidden" : ""
          }`}
          onClick={() => onSort("threadName")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("threadName");
            }
          }}
          aria-label={`Sort by thread name, currently ${
            currentField === "threadName"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            <span className="hidden sm:inline">Thread Name</span>
            <span className="sm:hidden">Name</span>
            <SortIcon
              field="threadName"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className={`cursor-pointer text-sm font-medium px-4 ${
            compact ? "hidden" : "hidden md:table-cell"
          }`}
          onClick={() => onSort("contextKey")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("contextKey");
            }
          }}
          aria-label={`Sort by context key, currently ${
            currentField === "contextKey"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            Context Key{" "}
            <SortIcon
              field="contextKey"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer text-sm font-medium px-4 hidden md:table-cell"
          onClick={() => onSort("messages")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("messages");
            }
          }}
          aria-label={`Sort by messages, currently ${
            currentField === "messages"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            Messages{" "}
            <SortIcon
              field="messages"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer text-sm font-medium px-4 hidden md:table-cell"
          onClick={() => onSort("errors")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSort("errors");
            }
          }}
          aria-label={`Sort by errors, currently ${
            currentField === "errors"
              ? direction === "asc"
                ? "ascending"
                : "descending"
              : "not sorted"
          }`}
        >
          <div className="flex text-foreground items-center gap-2">
            Errors{" "}
            <SortIcon
              field="errors"
              currentField={currentField}
              direction={direction}
            />
          </div>
        </TableHead>
        <TableHead className="text-sm font-medium text-foreground">
          <span className="hidden sm:inline">Actions</span>
          <span className="sm:hidden"></span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
