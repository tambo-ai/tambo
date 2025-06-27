import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// Project Overview Skeletons
export function ProjectInfoSkeleton() {
  return (
    <Card className="border-card-background bg-card-background rounded-3xl overflow-hidden p-4">
      <CardContent className="p-4 space-y-4">
        {/* Project name skeleton */}
        <Skeleton className="h-16 w-64" />

        {/* Grid items skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={
                i > 0 ? "border-l border-muted-foreground/20 pl-4" : ""
              }
            >
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyMessagesChartSkeleton() {
  return (
    <Card className="border border-none bg-transparent overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72" />
      </CardContent>
    </Card>
  );
}

export function ProjectOverviewSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <ProjectInfoSkeleton />
      <DailyMessagesChartSkeleton />
    </motion.div>
  );
}
