"use client";

import { Icons } from "@/components/icons";
import { MobileDashboardNavigation } from "@/components/sections/mobile-dashboard-navigation";
import { ProjectDropdown } from "@/components/sections/project-dropdown";
import { UserProfileDropdown } from "@/components/sections/user-profile-dropdown";
import { buttonVariants } from "@/components/ui/button";
import { TamboChatTrigger } from "@/components/tambo-chat-trigger";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
// Whitelabel badge
import { WhitelabelBadge } from "@/components/whitelabel-badge";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const params = useParams();

  // Get projectId from route params
  const projectId = params?.projectId as string | null;

  // Fetch user projects for dropdown
  const { data: projects, refetch: refetchProjects } =
    api.project.getUserProjects.useQuery(undefined, {
      enabled: !!session,
    });

  // Find current project
  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--dashboard-header-height)] backdrop-blur bg-background border-b border-border/20",
          className,
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-full items-center justify-between pt-2 px-4">
            {/* Left side - Logo/Project Dropdown */}
            <div className="flex items-center gap-4">
              {/* Show Tambo logo when not on a project page */}
              {!projectId && (
                <Link
                  href="/"
                  title="brand-logo"
                  className="relative mr-6 flex items-center"
                >
                  <Icons.logo
                    className="h-6 w-auto"
                    aria-label={siteConfig.name}
                  />

                  <WhitelabelBadge />
                </Link>
              )}

              {/* Show project dropdown when on a project page */}
              <ProjectDropdown
                projectId={projectId}
                projects={projects}
                currentProject={currentProject}
                refetchProjects={refetchProjects}
              />
            </div>

            {/* Right side - Desktop: Profile dropdown, Mobile: Mobile nav */}
            <div className="flex items-center gap-2">
              <a
                href={siteConfig.links.docs}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden md:inline-flex",
                )}
              >
                Docs
              </a>

              {/* Tambo Assistant Trigger - Desktop only */}
              <div className="hidden md:block">
                <TamboChatTrigger />
              </div>

              {/* Desktop Profile Dropdown */}
              <div className="hidden md:block">
                <UserProfileDropdown user={session?.user} />
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileDashboardNavigation />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
