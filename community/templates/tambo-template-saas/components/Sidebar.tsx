"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const navItems = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`hidden h-[calc(100vh-4rem)] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex ${collapsed ? "w-16" : "w-64"
                }`}
        >
            <div className="flex flex-1 flex-col gap-1 p-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-sidebar-foreground hover:bg-secondary hover:text-secondary-foreground"
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </div>

            <div className="border-t border-sidebar-border p-3">
                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-secondary"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>
        </aside>
    );
}
