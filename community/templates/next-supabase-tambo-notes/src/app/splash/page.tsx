'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Neural3DBackground } from '@/components/Neural3DBackground'

const NEU_LANGUAGES = [
  { text: 'Neu', lang: 'German' },
  { text: 'New', lang: 'English' },
  { text: 'Nouveau', lang: 'French' },
  { text: 'Nuovo', lang: 'Italian' },
  { text: 'Nuevo', lang: 'Spanish' },
  { text: 'Novo', lang: 'Portuguese' },
  { text: 'Nieuw', lang: 'Dutch' },
  { text: 'Ny', lang: 'Swedish' },
  { text: 'Ny', lang: 'Norwegian' },
  { text: 'Uusi', lang: 'Finnish' },
  { text: 'Nowy', lang: 'Polish' },
  { text: 'Новый', lang: 'Russian' },
  { text: '新', lang: 'Chinese' },
  { text: '新しい', lang: 'Japanese' },
  { text: '새로운', lang: 'Korean' },
  { text: 'جديد', lang: 'Arabic' },
  { text: 'नया', lang: 'Hindi' },
]

const SPLASH_DURATION_MS = 7.5 * 1000 // 7.5 seconds in milliseconds
const TEXT_CYCLE_INTERVAL = 500 // 500ms between language changes

export default function SplashPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showSkipButton, setShowSkipButton] = useState(false)
  const startTimeRef = useRef(Date.now())
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSkip = () => {
    // Clear all intervals and timeouts
    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current)
      textIntervalRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    // Navigate immediately
    router.replace('/auth')
  }

  useEffect(() => {
    const startTime = startTimeRef.current

    // Cycle through languages
    textIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NEU_LANGUAGES.length)
    }, TEXT_CYCLE_INTERVAL)

      // Update progress bar
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const newProgress = Math.min((elapsed / SPLASH_DURATION_MS) * 100, 100)
        setProgress(newProgress)

        if (elapsed >= SPLASH_DURATION_MS) {
          if (textIntervalRef.current) {
            clearInterval(textIntervalRef.current)
            textIntervalRef.current = null
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          router.replace('/auth')
        }
      }, 16) // ~60fps updates

      // Set up redirect timeout as backup
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/auth')
      }, SPLASH_DURATION_MS)

    // Cleanup on unmount
    return () => {
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current)
        textIntervalRef.current = null
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [router])

  // Handle keyboard navigation to show skip button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        setShowSkipButton(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const currentLanguage = NEU_LANGUAGES[currentIndex]

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center relative overflow-hidden">
      {/* 3D Neural Visualization Background */}
      <Neural3DBackground />
      
      {/* Skip button - only visible on keyboard navigation */}
      {showSkipButton && (
        <button
          onClick={handleSkip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleSkip()
            }
          }}
          className="absolute top-4 right-4 z-20 px-4 py-2 text-sm text-white/70 hover:text-white bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-black/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Skip to main"
        >
          Skip to main
        </button>
      )}

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 z-[1]" />

      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Main text with gradient */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-bold mb-4">
            <span className="text-white animate-gradient">
              {currentLanguage.text}
            </span>
            <span className="inline-block ml-4">
              <span className="relative">
                <span className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                <span className="relative inline-block w-3 h-3 bg-white rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
              </span>
            </span>
          </h1>
          
          {/* Language label */}
          <p className="text-sm text-white/70 font-medium tracking-wider uppercase mt-4">
            {currentLanguage.lang}
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/80 mb-12 font-light">
          NeuroDesk
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/50 blur-sm animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3 font-mono">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

    </div>
  )
}
