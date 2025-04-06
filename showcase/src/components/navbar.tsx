import { Icons } from "@/components/icons";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur w-full">
      <div className="flex justify-between items-center w-full px-4 md:px-6 p-2">
        <Link href="/" title="brand-logo" className="flex items-center">
          <Icons.logo className="h-6 w-auto" aria-label="Tambo" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="https://github.com/tambo-ai/tambo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 hover:bg-accent"
          >
            <Icons.github className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <hr className="absolute w-full bottom-0 border-border/50" />
    </header>
  );
}
