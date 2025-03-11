import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="px-[12%] py-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Built by{" "}
          <Link
            href="https://github.com/use-hydra-ai"
            target="_blank"
            className="font-medium text-foreground hover:text-foreground/80 transition-colors"
          >
            tambo
          </Link>
          .
        </div>
      </div>
    </footer>
  );
}
