"use client";

import { Icons } from "@/components/icons";
import { externalLinks } from "@/lib/navigation";
import { useMobile } from "@/providers/mobile-provider";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export function Navbar() {
  const { isMobile, isMobileMenuOpen, toggleMobileMenu } = useMobile();

  // Memoize desktop nav items
  const desktopNavItems = useMemo(() => {
    if (isMobile) return null;

    return (
      <div className="hidden md:flex items-center gap-2">
        {externalLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="rounded-md px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm border border-border/40"
          >
            {link.icon === "github" && <Icons.github className="h-4 w-4" />}
            <span>{link.title}</span>
          </Link>
        ))}
      </div>
    );
  }, [isMobile]);

  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur w-full">
      <div className="flex justify-between items-center w-full px-4 md:px-6 p-2">
        <Link href="/" title="brand-logo" className="flex items-center">
          <Icons.logo className="h-6 w-auto" aria-label="Tambo" />
        </Link>

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Desktop nav */}
        {desktopNavItems}
      </div>

      <hr className="absolute w-full bottom-0 border-border/50" />
    </header>
  );
}
