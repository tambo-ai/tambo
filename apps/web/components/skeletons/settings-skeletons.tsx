import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonButton,
  SkeletonLine,
} from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function SettingsPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-4 max-w-4xl mx-auto"
    >
      <Skeleton className="h-4 w-72 mb-4 mt-2" />
      <div className="space-y-6">
        <ProjectNameSkeleton />
        <APIKeyListSkeleton />
        <OAuthSettingsSkeleton />
        <DangerZoneSkeleton />
      </div>
    </motion.div>
  );
}

export function AgentPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-4 max-w-4xl mx-auto"
    >
      <Skeleton className="h-4 w-64 mb-4 mt-2" />
      <div className="space-y-6">
        <CustomInstructionsEditorSkeleton />
        <AvailableMcpServersSkeleton />
        <SkillsSectionSkeleton />
        <MemorySettingsSkeleton />
        <ToolCallLimitSkeleton />
        <ProviderKeySectionSkeleton />
      </div>
    </motion.div>
  );
}

function ProjectNameSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <SkeletonButton className="w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function APIKeyListSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <SkeletonButton className="w-20" />
        </div>
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-6 w-48 rounded-full" />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DangerZoneSkeleton() {
  return (
    <Card className="border-destructive/50 border rounded-md overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-80 mt-1" />
      </CardHeader>
      <CardContent>
        <SkeletonButton className="w-36" />
      </CardContent>
    </Card>
  );
}

function ProviderKeySectionSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonButton />
        </div>
      </CardContent>
    </Card>
  );
}

function CustomInstructionsEditorSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-80" />
          </div>
          <SkeletonButton className="w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[150px] space-y-3">
          <div className="min-h-[100px] rounded-md border border-muted bg-muted/50 p-3 space-y-2">
            <SkeletonLine />
            <SkeletonLine className="w-[80%]" />
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-5/6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AvailableMcpServersSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <SkeletonButton className="w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-[2]" />
                <Skeleton className="h-9 flex-[5]" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsSectionSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex gap-2">
            <SkeletonButton className="w-24" />
            <SkeletonButton className="w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}

function ToolCallLimitSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-72 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <SkeletonButton className="w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function MemorySettingsSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function OAuthSettingsSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-80 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
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
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex justify-end pt-4 border-t">
          <SkeletonButton className="w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
