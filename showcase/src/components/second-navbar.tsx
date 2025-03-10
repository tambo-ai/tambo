"use client"

import { cn } from "@/lib/utils"

interface SecondNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SecondNavbar({ activeTab, onTabChange }: SecondNavbarProps) {    
  const items = ['Examples', 'Messages', 'Threads', 'Forms', 'Graphs']
  
  return (
    <nav className="bg-background/50 backdrop-blur-sm border border-border/40 rounded-full px-2 py-1.5">
      {items.map((item) => {
        const isActive = activeTab === item
        return (
          <button
            key={item}
            onClick={() => onTabChange(item)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
            )}
          >
            {item}
          </button>
        )
      })}
    </nav>
  )
} 