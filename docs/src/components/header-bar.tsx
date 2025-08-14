import HeaderSearch from "@/components/header-search";
import Image from "next/image";
import Link from "next/link";

export default function HeaderBar() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-black/60">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        <Link href="/" aria-label="Tambo">
          <Image
            src="/logo/lockup/Tambo-Lockup.svg"
            alt="Tambo Lockup"
            width={100}
            height={26}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <HeaderSearch />
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="https://tambo.co/discord" className="hover:underline">
            Discord
          </Link>
          <Link href="https://tambo.co/gh" className="hover:underline">
            GitHub
          </Link>
          <Link href="https://tambo.co" className="hover:underline">
            Website
          </Link>
        </nav>
      </div>
    </div>
  );
}
