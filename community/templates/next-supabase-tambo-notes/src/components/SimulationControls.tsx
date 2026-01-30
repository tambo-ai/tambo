'use client'

import { useState } from 'react'
import { BRAIN_REGIONS, type RegionId } from '@/lib/brain/regions'

interface SimulationControlsProps {
  currentState: any // ExtendedBrainState - avoiding circular import
  onStimulate: (region: RegionId, intensity: number, frequency: number) => Promise<void>
  onSaveSession: (title: string) => Promise<void>
  onReset: () => void
}

export function SimulationControls({ currentState, onStimulate, onSaveSession, onReset }: SimulationControlsProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('frontal')
  const [intensity, setIntensity] = useState(0.4) // 0-1 range, default 40%
  const [frequency, setFrequency] = useState(10.0) // Hz
  const [sessionName, setSessionName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleStimulate = async () => {
    await onStimulate(selectedRegion, intensity, frequency)
  }

  const handleSaveSession = async () => {
    if (!sessionName.trim()) return
    setIsSaving(true)
    try {
      await onSaveSession(sessionName.trim())
      setSessionName('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="nl-card p-6">
      <h3 className="text-sm font-bold text-neutral-100 mb-6 uppercase tracking-wider">Simulation Controls</h3>
      
      <div className="space-y-6">
        {/* Brain Region Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">
            Brain Region
          </label>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionId)}
              className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40 appearance-none cursor-pointer"
            >
              {Object.values(BRAIN_REGIONS).map((region) => (
                <option key={region.id} value={region.id} className="bg-neutral-900">
                  {region.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Intensity Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Intensity
            </label>
            <span className="text-sm font-semibold text-white">
              {Math.round(intensity * 100)}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ffffff ${intensity * 100}%, rgba(255, 255, 255, 0.2) ${intensity * 100}%)`,
              }}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #ffffff;
                cursor: pointer;
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
              }
              .slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #ffffff;
                cursor: pointer;
                border: none;
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
              }
            `}</style>
          </div>
        </div>

        {/* Frequency Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Frequency
            </label>
            <span className="text-sm font-semibold text-white">
              {frequency.toFixed(1)} Hz
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0.5"
              max="60"
              step="0.1"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ffffff ${(frequency / 60) * 100}%, rgba(255, 255, 255, 0.2) ${(frequency / 60) * 100}%)`,
              }}
            />
          </div>
        </div>

        {/* Stimulate Region Button */}
        <button
          onClick={handleStimulate}
          className="w-full px-4 py-3 bg-white text-black rounded-lg font-semibold text-sm hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-white/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Stimulate Region</span>
        </button>

        {/* Session Name Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">
            Session Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name..."
              className="flex-1 px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sessionName.trim()) {
                  handleSaveSession()
                }
              }}
            />
            <button
              onClick={handleSaveSession}
              disabled={!sessionName.trim() || isSaving}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reset State Button */}
        <button
          onClick={onReset}
          className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white text-sm font-semibold hover:bg-neutral-800 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset State</span>
        </button>
      </div>
    </div>
  )
}
