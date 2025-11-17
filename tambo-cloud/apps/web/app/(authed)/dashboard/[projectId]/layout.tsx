"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { SlashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use } from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = use(params);
  const pathname = usePathname();

  // Fetch project data to get the project name
  const { data: project } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  // Determine active tab value
  const activeTab = pathname.includes("/observability")
    ? "observability"
    : pathname.includes("/settings")
      ? "settings"
      : "overview";

  return (
    <div className="flex flex-col bg-background">
      {/* Sticky Navigation Section */}
      <div className="sticky top-[var(--header-height)] z-40 bg-background">
        <div className="container mx-auto px-4 md:px-6 pb-0">
          {/* Navigation Row */}
          <motion.div
            className="flex flex-col gap-2 sm:gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="py-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href="/dashboard"
                      className="text-xs sm:text-sm text-muted-foreground"
                    >
                      <span className="hidden sm:inline">All Projects</span>
                      <span className="sm:hidden">Projects</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon
                    className="h-3 w-3 text-muted-foreground -rotate-[30deg] -mx-2"
                    size={16}
                    strokeWidth={1.5}
                  />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs sm:text-sm text-foreground truncate max-w-[150px] sm:max-w-none">
                    {project?.name || "Loading..."}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Project Navigation Tabs */}
            <Tabs value={activeTab} className="w-full overflow-x-auto">
              <TabsList className="h-12 sm:h-16 bg-transparent inline-flex w-full sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-foreground px-3 sm:px-4"
                  asChild
                >
                  <Link href={`/dashboard/${projectId}`}>Overview</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="observability"
                  className="text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-foreground px-3 sm:px-4"
                  asChild
                >
                  <Link href={`/dashboard/${projectId}/observability`}>
                    Observability
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-foreground px-3 sm:px-4"
                  asChild
                >
                  <Link href={`/dashboard/${projectId}/settings`}>
                    Settings
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          <Separator />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <Suspense fallback={<div className="h-32 animate-pulse"></div>}>
            {children}
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
