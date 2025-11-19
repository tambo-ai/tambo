import { Icons } from "@/components/icons";
import { TamboChatTrigger } from "@/components/tambo-chat-trigger";
import { buttonVariants } from "@/components/ui/button";
import { WhitelabelBadge } from "@/components/whitelabel-badge";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function BlogHeader({
  transparent = true,
  className,
}: {
  transparent?: boolean;
  className?: string;
}) {
  // Set background opacity based on transparency setting
  const bgOpacity = transparent ? "bg-background/60" : "bg-background";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[var(--header-height)] backdrop-blur border-b border-border/20",
        bgOpacity,
      )}
    >
      <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-6", className)}>
        <div className="flex h-full items-center justify-between pt-2">
          <Link
            href="/"
            title="brand-logo"
            className="relative mr-6 flex items-center"
          >
            <Icons.logo className="h-6 w-auto" aria-label={siteConfig.name} />

            {/* Partner whitelabel badge */}
            <WhitelabelBadge />
          </Link>

          {/* Dashboard button - visible on all screen sizes */}
          <div className="flex items-center gap-2">
            <TamboChatTrigger />
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-9 rounded-md group tracking-tight font-medium text-sm",
              )}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
