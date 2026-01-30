'use client'

import { useEffect, useState } from 'react'

interface SignalMeterProps {
  label: string
  value: number
  max?: number
  color?: string
}

function SignalMeter({ label, value, max = 100, color = 'primary' }: SignalMeterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    // Smooth animation to target value
    const duration = 500
    const startValue = displayValue
    const startTime = Date.now()
    let animationFrame: number
    let cancelled = false

    const animate = () => {
      if (cancelled) return
      
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (value - startValue) * eased
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      cancelled = true
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value])

  const colorClasses = {
    primary: 'bg-white',
    destructive: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  }

  const glowColors = {
    primary: 'shadow-[0_0_8px_rgba(255,255,255,0.5)]',
    destructive: 'shadow-[0_0_8px_rgb(239,68,68)]',
    blue: 'shadow-[0_0_8px_rgb(59,130,246)]',
    green: 'shadow-[0_0_8px_rgb(34,197,94)]',
    yellow: 'shadow-[0_0_8px_rgb(234,179,8)]',
  }

  return (
    <div className="space-y-2.5 group">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground tabular-nums bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {displayValue.toFixed(1)}
        </span>
      </div>
      <div className="relative h-3.5 bg-neutral-900/50 rounded-full overflow-hidden shadow-inner border border-neutral-800/30">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} rounded-full transition-all duration-700 ease-out relative ${glowColors[color as keyof typeof glowColors] || glowColors.primary}`}
          style={{
            width: `${(displayValue / max) * 100}%`,
          }}
        >
          {/* Premium shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  )
}

interface SignalMetersProps {
  signals?: Record<string, number>
  wave?: { type?: string; freqHz?: number; amp?: number }
  className?: string
}

// Compute dominant wave from frequency
function computeDominantWave(frequency: number): 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma' {
  if (frequency < 4) return 'delta'
  if (frequency < 8) return 'theta'
  if (frequency < 13) return 'alpha'
  if (frequency < 30) return 'beta'
  return 'gamma'
}

export function SignalMeters({ signals = {}, wave, className = '' }: SignalMetersProps) {
  const frequency = wave?.freqHz ?? 10
  const amplitude = wave?.amp ?? 50
  const dominantWave = computeDominantWave(frequency)

  // Display dominant wave as a badge/text, not a meter
  const waveLabels: Record<string, string> = {
    delta: 'DELTA',
    theta: 'THETA',
    alpha: 'ALPHA',
    beta: 'BETA',
    gamma: 'GAMMA',
  }

  return (
    <div className={`premium-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] ${className}`}>
      <div className="px-4 py-3 border-b border-neutral-800/50 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-widest flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Signal Meters
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Amplitude Meter */}
        <SignalMeter 
          label="Amplitude" 
          value={amplitude} 
          max={100}
          color="primary"
        />
        
        {/* Frequency Meter */}
        <SignalMeter 
          label="Frequency" 
          value={frequency} 
          max={60}
          color="primary"
        />
        
        {/* Dominant Wave Display */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
              Dominant Wave
            </span>
            <span className="text-sm font-bold text-white tabular-nums px-3 py-1 bg-white/10 border border-white/20 rounded-md">
              {waveLabels[dominantWave] || 'ALPHA'}
            </span>
          </div>
          <div className="relative h-3.5 bg-neutral-900/50 rounded-full overflow-hidden shadow-inner border border-neutral-800/30">
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                {dominantWave}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
