import { cn } from "@/lib/utils";
import Link from "next/link";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={cn(
        "w-64 fixed top-[var(--header-height)] bottom-0 left-0 border-r border-border/40 p-4 overflow-y-auto flex flex-col",
        className,
      )}
    >
      <nav className="space-y-6 flex-grow">
        <div className="space-y-2">
          <Link
            href="/docs"
            className="block px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
          >
            Home
          </Link>
          <Link
            href="/docs/get-started"
            className="block px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
          >
            Get Started
          </Link>
        </div>

        <div className="space-y-3">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Components
          </h3>

          <div className="space-y-2">
            <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Blocks
            </h4>

            <div className="space-y-1">
              <Link
                href="/docs/message-thread-full"
                className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md"
              >
                MessageThreadFull
              </Link>
              <Link
                href="/docs/message-thread-collapsible"
                className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md"
              >
                MessageThreadCollapsible
              </Link>
              <Link
                href="/docs/message-thread-panel"
                className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md"
              >
                MessageThreadPanel
              </Link>
            </div>

            <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Generative
            </h4>

            <div className="space-y-1">
              <Link
                href="/docs/form-component"
                className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md"
              >
                FormComponent
              </Link>
              <Link
                href="/docs/graph"
                className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md"
              >
                Graph
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-4 mt-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground px-3 font-sentient">
          Fractal Dynamics Inc © 2025
        </p>
      </div>
    </div>
  );
}
