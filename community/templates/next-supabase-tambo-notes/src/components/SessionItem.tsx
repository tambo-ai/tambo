'use client'

import { useState } from 'react'

interface SessionItemProps {
  session: {
    id: string
    title: string
    state: {
      regions?: Record<string, any>
      waveInfo?: any
      updatedAt?: string
    }
    created_at: string
  }
  isSelected?: boolean
  onClick?: () => void
}

export function SessionItem({ session, isSelected, onClick }: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const regionCount = session.state?.regions 
    ? Object.keys(session.state.regions).length 
    : 0

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full text-left p-4 rounded-xl transition-all duration-300 border backdrop-blur-sm relative overflow-hidden group ${
        isSelected
          ? 'premium-card border-primary/50 shadow-lg shadow-primary/30 scale-[1.02] glow-primary-strong'
          : isHovered
          ? 'premium-card border-neutral-800/50 shadow-md scale-[1.01] glow-primary'
          : 'bg-neutral-900/30 hover:bg-neutral-900/50 border-neutral-800/30 shadow-sm'
      }`}
    >
      {/* Subtle gradient overlay on hover */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
      )}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 pointer-events-none"></div>
      )}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold mb-1.5 truncate transition-colors ${
            isSelected 
              ? 'text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent' 
              : 'text-foreground group-hover:text-foreground/90'
          }`}>
            {session.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {regionCount > 0 ? `${regionCount} region${regionCount !== 1 ? 's' : ''}` : 'Empty'}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(session.created_at)}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          </div>
        )}
      </div>
    </button>
  )
}
