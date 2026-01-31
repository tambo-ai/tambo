"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isLandingPage = pathname === "/";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <span className="text-sm font-bold text-primary-foreground">T</span>
                        </div>
                        <span className="text-lg font-semibold text-foreground">
                            Tambo SaaS
                        </span>
                    </Link>

                    {!isLandingPage && (
                        <div className="hidden items-center gap-4 md:flex">
                            <Link
                                href="/dashboard"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/dashboard"
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/settings"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/settings"
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                Settings
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {isLandingPage ? (
                        <Link
                            href="/dashboard"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Get Started
                        </Link>
                    ) : (
                        <>
                            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-secondary md:flex">
                                <span className="text-sm font-medium text-secondary-foreground">
                                    U
                                </span>
                            </div>
                            <button
                                type="button"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {mobileMenuOpen && !isLandingPage && (
                <div className="border-t border-border bg-background px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/dashboard"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === "/dashboard"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary"
                                }`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/settings"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === "/settings"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary"
                                }`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Settings
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
