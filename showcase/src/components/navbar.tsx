import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50">
      <div className="mx-[10%] my-4">
        <div className="bg-background/80 backdrop-blur-sm ">
          <div className="flex items-center h-16 px-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-3xl font-bold">
                tambo
              </Link>
              <Link
                href="/docs"
                className="text-md text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                Docs
              </Link>
            </div>
            <div className="flex-1" />
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
