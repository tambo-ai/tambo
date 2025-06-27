import { Card } from "@/components/ui/card";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton, SkeletonButton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";

export function ObservabilityPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-var(--header-height)-8rem)] overflow-hidden py-2 px-2"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-semibold min-h-[3.5rem] flex items-center">
          <Skeleton className="h-10 w-32" />
        </h1>
        <Skeleton className="h-9 w-9" />
      </div>

      {/* ThreadTable skeleton */}
      <div className="flex-1 overflow-hidden">
        <ThreadTableSkeleton />
      </div>
    </motion.div>
  );
}

export function ThreadTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search, Filters, and Actions skeleton */}
      <div className="flex items-center justify-between gap-4 mt-2 p-2">
        <div className="w-1/4">
          <SkeletonButton className="w-20" />
        </div>
        <div className="relative w-1/2">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        <div className="w-1/4 flex justify-end">
          <SkeletonButton />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-md w-full overflow-hidden">
        {/* Pagination header skeleton */}
        <div className="flex items-center justify-end gap-2 px-4 py-2">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Table skeleton */}
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {[
                "Thread ID",
                "Thread Name",
                "Context Key",
                "Messages",
                "Components",
                "Tools",
                "Errors",
                "Updated",
                "Actions",
              ].map((_, idx) => (
                <TableHead key={idx}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIdx) => (
              <TableRow key={rowIdx} className="border-b">
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                {[...Array(9)].map((_, cellIdx) => (
                  <TableCell key={cellIdx}>
                    <Skeleton
                      className={`h-4 ${cellIdx === 8 ? "w-24" : "w-16"}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ThreadMessagesModalSkeleton() {
  return (
    <>
      {/* Header */}
      <SheetHeader className="flex-shrink-0">
        <SheetTitle className="sr-only">Loading Thread</SheetTitle>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
        </div>
      </SheetHeader>

      {/* Search */}
      <div className="space-y-4 mt-1 flex-shrink-0">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-4">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </Card>
        ))}
      </div>

      {/* Messages with date separators */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-4 px-2">
        <DateSeparatorSkeleton />
        <MessageSkeletonGroup count={3} />
        <DateSeparatorSkeleton />
        <MessageSkeletonGroup count={2} startIndex={3} />
      </div>
    </>
  );
}

function DateSeparatorSkeleton() {
  return (
    <div className="flex justify-center items-center py-4">
      <Skeleton className="h-6 w-20 rounded-full bg-muted/80" />
    </div>
  );
}

function MessageSkeletonGroup({
  count,
  startIndex = 0,
}: {
  count: number;
  startIndex?: number;
}) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={`msg-${startIndex + i}`}
          className={`flex ${(startIndex + i) % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <div className="max-w-[85%] space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="rounded-2xl p-5 bg-muted/20">
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </>
  );
}
