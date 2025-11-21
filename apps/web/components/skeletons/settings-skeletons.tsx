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
      className="flex flex-col pl-4 pr-4"
    >
      {/* Header skeleton */}
      <div className="bg-background w-full">
        <div className="flex items-center justify-between py-2 px-2">
          <h1 className="text-4xl font-semibold min-h-[3.5rem] flex items-center">
            <Skeleton className="h-10 w-48" />
          </h1>
          <div className="flex gap-3">
            <SkeletonButton className="w-16" />
            <SkeletonButton className="w-16" />
          </div>
        </div>
      </div>

      {/* Main Layout skeleton */}
      <div className="flex gap-48 w-full">
        {/* Sidebar Navigation skeleton */}
        <div className="py-6 w-1/5">
          <div className="flex flex-col gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-full" />
            ))}
          </div>
        </div>

        {/* Scrollable Content skeleton */}
        <div className="h-[calc(100vh-200px)] w-full overflow-y-auto pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <div className="space-y-4">
            <div className="p-2">
              <APIKeyListSkeleton />
            </div>
            <div className="p-2">
              <ProviderKeySectionSkeleton />
            </div>
            <div className="p-2">
              <CustomInstructionsEditorSkeleton />
            </div>
            <div className="p-2">
              <AvailableMcpServersSkeleton />
            </div>
            <div className="p-2">
              <OAuthSettingsSkeleton />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function APIKeyListSkeleton() {
  return (
    <Card className="border rounded-md overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
          </div>
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
        {/* Validation Mode Label */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />

          {/* Radio Group Options */}
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

        {/* Conditional Input Field Area */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-64" />
        </div>

        {/* Save Button Area */}
        <div className="flex justify-end pt-4 border-t">
          <SkeletonButton className="w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
