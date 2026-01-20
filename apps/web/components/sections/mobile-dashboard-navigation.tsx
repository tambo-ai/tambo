"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/lib/config";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import { api } from "@/trpc/react";
import { track } from "@vercel/analytics";
import {
  BookOpen,
  Bug,
  Calendar,
  LogOut,
  Menu,
  MessageSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSignOut } from "@/hooks/nextauth";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

export function MobileDashboardNavigation() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { togglePanel } = useMessageThreadPanel();
  const signOut = useSignOut();

  const projectId = params?.projectId as string | null;

  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  // Fetch user projects for dropdown
  const { data: projects } = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });

  // Find current project
  const currentProject = projects?.find((p) => p.id === projectId);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      track("User Logout");
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleProjectChange = (selectedProjectId: string) => {
    if (selectedProjectId !== projectId) {
      router.push(`/dashboard/${selectedProjectId}`);
    }
  };

  // Get user initial for avatar fallback
  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-6">
          <DrawerTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={session?.user?.email || "User"}
              />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">Hi, {displayName}</span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.email}
              </span>
            </div>
          </DrawerTitle>

          {/* Project Selector */}
          {projectId && projects && projects.length > 0 && (
            <div className="pt-4">
              <Select value={projectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {currentProject?.name || "Select project"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DrawerHeader>

        <div className="px-6 flex flex-col gap-2">
          <a
            href={siteConfig.links.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            Docs
          </a>

          <a
            href={siteConfig.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            Discord
          </a>

          <a
            href={`${siteConfig.links.github}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <Bug className="h-4 w-4" />
            Create Issue
          </a>

          <a
            href={`mailto:${siteConfig.links.email}?subject=Meeting Request`}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Meet with Founder
          </a>
          <DrawerClose asChild>
            <button
              onClick={togglePanel}
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer text-left"
            >
              <Image
                src="/logo/icon/Octo-Icon.svg"
                width={16}
                height={16}
                alt="Tambo Assistant"
                className="w-5 h-5"
              />
              Ask Tambo
            </button>
          </DrawerClose>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
