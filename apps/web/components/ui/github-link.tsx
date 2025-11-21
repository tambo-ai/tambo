import { Icons } from "@/components/icons"; // Assuming you have a GitHub icon in Icons

export function GitHubLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      className="flex items-center space-x-2 rounded-lg bg-secondary/80 px-3 py-2 text-sm font-medium text-secondary-foreground ring-1 ring-inset ring-secondary hover:bg-secondary/90 transition-colors whitespace-nowrap"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icons.github className="h-4 w-4" />
      <span>{text}</span>
    </a>
  );
}
