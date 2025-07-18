import { ChevronRight, Code2Icon, LucideIcon } from "lucide-react";
import Link from "next/link";

interface LearnMoreProps {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
}

export default function LearnMore({
  title,
  description,
  href,
  icon: Icon = Code2Icon,
}: LearnMoreProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg group"
      style={{ textDecoration: "none" }}
    >
      <div className="flex-shrink-0">
        <Icon className="bg-gray-200 w-12 h-12 rounded-md bg-accent p-4" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <div className="font-semibold">{title}</div>
          <ChevronRight
            className="w-4 h-4 text-neutral-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            aria-hidden="true"
          />
        </div>
        <div className="text-neutral-500 text-sm">{description}</div>
      </div>
    </Link>
  );
}
