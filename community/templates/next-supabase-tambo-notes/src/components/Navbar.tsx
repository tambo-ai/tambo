'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export function Navbar() {
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <nav className="border-b border-neutral-800/60 backdrop-blur-md bg-[#0a0a0f]/80">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Back arrow + Icon + Title + Subtitle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-800/50 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              {/* Brain Icon */}
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-100">NeuroDesk</h1>
                <p className="text-xs text-neutral-400">Neural Simulation Lab</p>
              </div>
            </div>
          </div>

          {/* Right: Status + Settings */}
          <div className="flex items-center gap-3">
            {/* LIVE SIMULATION badge */}
            <div className="nl-pill bg-white/20 border border-white/40 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="font-semibold">LIVE SIMULATION</span>
            </div>

            {/* Settings dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-neutral-800/50 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showSettings && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSettings(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 nl-card rounded-lg shadow-xl z-20 p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
