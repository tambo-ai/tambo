'use client'

import { SessionItem } from './SessionItem'
import { useEffect, useState } from 'react'

interface Session {
  id: string
  title: string
  state: {
    regions?: Record<string, any>
    waveInfo?: any
    updatedAt?: string
  }
  created_at: string
}

interface SessionsListProps {
  sessions: Session[]
  selectedSessionId?: string
  onSelectSession: (sessionId: string) => void
}

export function SessionsList({ sessions, selectedSessionId, onSelectSession }: SessionsListProps) {
  const [visibleSessions, setVisibleSessions] = useState<Session[]>([])

  useEffect(() => {
    // Animate sessions in with stagger
    if (sessions.length === 0) {
      setVisibleSessions([])
      return
    }

    const timer = setTimeout(() => {
      setVisibleSessions(sessions)
    }, 50)

    return () => clearTimeout(timer)
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-800">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-foreground mb-1 font-medium">No sessions yet</p>
          <p className="text-xs text-muted-foreground">Save your first session to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto p-4 space-y-2">
      {visibleSessions.map((session, index) => (
        <div
          key={session.id}
          className="animate-slide-in"
          style={{
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'both',
          }}
        >
          <SessionItem
            session={session}
            isSelected={selectedSessionId === session.id}
            onClick={() => onSelectSession(session.id)}
          />
        </div>
      ))}
    </div>
  )
}
