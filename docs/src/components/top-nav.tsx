"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LargeSearchToggle,
  SearchToggle,
} from "fumadocs-ui/components/layout/search-toggle";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { cn } from "fumadocs-ui/utils/cn";

export default function TopNav() {
  return (
    <nav className="flex h-14 items-center border-b px-4">
      <Link href="/" className="mr-4">
        <Image
          src="/logo/lockup/Tambo-Lockup.svg"
          alt="Tambo Lockup"
          width={100}
          height={26}
          className="h-7 w-auto"
        />
      </Link>
      <div className="flex flex-1 items-center justify-end gap-4">
        <LargeSearchToggle className="hidden w-full max-w-xs md:flex" />
        <SearchToggle className="md:hidden" />
        <Link
          href="https://tambo.co/discord"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
        >
          Discord
        </Link>
        <Link
          href="https://tambo.co/gh"
          target="_blank"
          rel="noreferrer"
          className="text-sm"
        >
          GitHub
        </Link>
        <Link
          href="https://tambo.co/"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ color: "primary", size: "sm" }))}
        >
          Cloud
        </Link>
      </div>
    </nav>
  );
}
