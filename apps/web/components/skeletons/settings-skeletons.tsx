import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonButton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function SectionSkeleton({
  titleWidth,
  cardClassName,
  children,
}: {
  titleWidth: string;
  cardClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Skeleton className={`h-5 ${titleWidth} mb-3`} />
      <Card className={cardClassName}>
        <CardContent className="px-6 py-2 divide-y divide-border">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

function RowSkeleton({
  labelWidth,
  descriptionWidth,
  children,
}: {
  labelWidth: string;
  descriptionWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <Skeleton className={`h-4 ${labelWidth}`} />
        {descriptionWidth && (
          <Skeleton className={`h-3.5 ${descriptionWidth}`} />
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-4 max-w-4xl mx-auto rounded-lg p-4"
    >
      <div className="space-y-8">
        {/* General: one SettingsRow with project name + edit button */}
        <SectionSkeleton titleWidth="w-16">
          <RowSkeleton labelWidth="w-24" descriptionWidth="w-52">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <SkeletonButton className="w-12" />
            </div>
          </RowSkeleton>
        </SectionSkeleton>

        {/* API Keys: description + "Add Key" button, then key items */}
        <SectionSkeleton titleWidth="w-16">
          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-60" />
              <SkeletonButton className="w-20" />
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-md border space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-6 w-40 rounded" />
                  </div>
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              </div>
            </div>
          </div>
        </SectionSkeleton>

        {/* Authentication: token toggle row + radio group with 4 options */}
        <SectionSkeleton titleWidth="w-28">
          <RowSkeleton labelWidth="w-28" descriptionWidth="w-80">
            <Skeleton className="h-6 w-11 rounded-full" />
          </RowSkeleton>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <Skeleton className="h-4 w-4 rounded-full mt-1" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <SkeletonButton className="w-16" />
            </div>
          </div>
        </SectionSkeleton>

        {/* Danger Zone: description + delete button side-by-side */}
        <SectionSkeleton
          titleWidth="w-24"
          cardClassName="border-destructive/50"
        >
          <RowSkeleton labelWidth="w-32" descriptionWidth="w-80">
            <SkeletonButton className="w-36" />
          </RowSkeleton>
        </SectionSkeleton>
      </div>
    </motion.div>
  );
}

export function AgentPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-4 max-w-4xl mx-auto rounded-lg p-4"
    >
      <div className="space-y-8">
        {/* Model: mode select row + provider/model combobox row */}
        <SectionSkeleton titleWidth="w-14">
          <RowSkeleton labelWidth="w-16" descriptionWidth="w-48">
            <Skeleton className="h-10 w-[140px] rounded-md" />
          </RowSkeleton>
          <RowSkeleton labelWidth="w-32" descriptionWidth="w-56">
            <Skeleton className="h-10 w-full min-w-[200px] rounded-md" />
          </RowSkeleton>
        </SectionSkeleton>

        {/* Instructions: heading + description + textarea (not inside a card) */}
        <div>
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3.5 w-80 mb-3" />
          <Skeleton className="h-[150px] w-full rounded-md" />
        </div>

        {/* Behavior: 4 SettingsRows with toggles/values */}
        <SectionSkeleton titleWidth="w-20">
          <RowSkeleton labelWidth="w-48" descriptionWidth="w-96">
            <Skeleton className="h-6 w-11 rounded-full" />
          </RowSkeleton>
          <RowSkeleton labelWidth="w-24" descriptionWidth="w-80">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-8" />
              <SkeletonButton className="w-12" />
            </div>
          </RowSkeleton>
          <RowSkeleton labelWidth="w-28" descriptionWidth="w-96">
            <Skeleton className="h-6 w-11 rounded-full" />
          </RowSkeleton>
          <RowSkeleton labelWidth="w-36" descriptionWidth="w-96">
            <Skeleton className="h-6 w-11 rounded-full" />
          </RowSkeleton>
        </SectionSkeleton>

        {/* Skills: description + buttons, then skill cards */}
        <SectionSkeleton titleWidth="w-12">
          <div className="py-3 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-56" />
              <div className="flex gap-2">
                <SkeletonButton className="w-20" />
                <SkeletonButton className="w-24" />
              </div>
            </div>
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </SectionSkeleton>

        {/* Integrations: description + add button, then server entry */}
        <SectionSkeleton titleWidth="w-24">
          <div className="py-3 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-56" />
              <SkeletonButton className="w-32" />
            </div>
            <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </SectionSkeleton>
      </div>
    </motion.div>
  );
}

export { SectionSkeleton, RowSkeleton };
