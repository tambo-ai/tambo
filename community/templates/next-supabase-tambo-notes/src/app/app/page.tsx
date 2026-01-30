'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { SessionsList } from '@/components/SessionsList'
import { BrainMap } from '@/components/BrainMap'
import { Waveform } from '@/components/Waveform'
import { SignalMeters } from '@/components/SignalMeters'
import { SimulationControls } from '@/components/SimulationControls'
import { SupabaseError } from '@/components/SupabaseError'
import { TamboError } from '@/components/TamboError'
import { SetupRequired } from '@/components/SetupRequired'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { StreamingError } from '@/components/StreamingError'
import { TamboProvider, useTamboThread } from '@tambo-ai/react'
import { MCPTransport } from '@tambo-ai/react/mcp'
import { ScrollableMessageContainer } from '@tambo-ai/ui-registry/components/scrollable-message-container'
import { ThreadContent, ThreadContentMessages } from '@tambo-ai/ui-registry/components/thread-content'
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from '@tambo-ai/ui-registry/components/message-input'
import { useUserContextKey } from '@/lib/useUserContextKey'
import { tamboTools, setBrainStateAccessors } from '@/lib/tambo-tools'
import { toolEvents } from '@/lib/tool-events'
import type { BrainState } from '@/lib/brain/sim'
import { BRAIN_REGIONS, type RegionId } from '@/lib/brain/regions'
import { generateWaveformSamples, calculateSignals, stimulateRegion, computeDominantWave } from '@/lib/brain/sim'

interface ExtendedBrainState extends Omit<BrainState, 'regions'> {
  regions?: Record<string, { x: number; y: number; label: string; active?: boolean; activity?: number }>
  waveInfo?: { data?: number[]; frequency?: number; amplitude?: number }
  signals?: Record<string, number>
}

interface Session {
  id: string
  title: string
  state: ExtendedBrainState
  created_at: string
}

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || 'https://everything-mcp.tambo.co/mcp'

function AppContent() {
  const router = useRouter()
  const { thread, sendThreadMessage } = useTamboThread()
  const [streamingError, setStreamingError] = useState<Error | null>(null)
  
  // Monitor for streaming errors
  useEffect(() => {
    if (streamingError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:60',message:'STREAMING_ERROR_DETECTED',data:{error:streamingError.message, name:streamingError.name, stack:streamingError.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }, [streamingError])
  
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>()
  const [currentState, setCurrentState] = useState<ExtendedBrainState>(() => {
    const initialRegions: Record<RegionId, number> = {
      frontal: 0,
      parietal: 0,
      occipital: 0,
      temporal: 0,
      cerebellum: 0,
      brainstem: 0,
    }

    const initialWave = {
      type: 'alpha' as const,
      freqHz: 10,
      amp: 50,
    }

    const brainState: BrainState = {
      regions: initialRegions,
      wave: initialWave,
      updatedAt: new Date().toISOString(),
    }

    const signals = calculateSignals(brainState)
    const waveData = generateWaveformSamples(initialWave, 200)

    return {
      ...brainState,
      regions: Object.fromEntries(
        Object.entries(BRAIN_REGIONS).map(([id, region]) => [
          id,
          { x: region.x, y: region.y, label: region.label, active: false },
        ])
      ) as Record<string, { x: number; y: number; label: string; active?: boolean }>,
      waveInfo: { data: waveData, frequency: initialWave.freqHz, amplitude: initialWave.amp },
      signals,
    }
  })
  const previousMessageCountRef = useRef<number>(0)
  const [activeTab, setActiveTab] = useState<'waveform' | 'analysis'>('waveform')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkSession() {
      if (!supabase) return
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (cancelled) return

        if (error || !session || !session.access_token) {
          router.replace('/auth')
          return
        }

        setLoading(false)
        setSessionReady(true)
      } catch (error) {
        if (cancelled) return
        router.replace('/auth')
      }
    }

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT' || !session || !session.access_token) {
        router.replace('/auth')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          setLoading(false)
          setSessionReady(true)
        }
      }
    })

    checkSession()

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
      }
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [router])

  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!supabase) return

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
        setSessionsError('Couldn\'t load sessions')
        return
      }

      setSessionsError(null)
      const response = await fetch('/api/sessions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/auth')
          return
        }
        throw new Error('Failed to fetch sessions')
      }

      const { sessions: fetchedSessions } = await response.json()
      setSessions(fetchedSessions || [])
    } catch (error) {
      // Only set error if we're not redirecting
      if (error instanceof Error && !error.message.includes('redirect')) {
        setSessionsError('Couldn\'t load sessions')
      }
    }
  }, [router])

  // Helper to convert UI state to BrainState
  const getBrainState = useCallback((): BrainState => {
    const regions: Record<RegionId, number> = Object.fromEntries(
      Object.entries(BRAIN_REGIONS).map(([id]) => {
        const regionData = currentState.regions?.[id]
        let activation = 0
        if (regionData && typeof regionData === 'object' && 'active' in regionData) {
          activation = regionData.active ? 50 : 0
        } else if (typeof regionData === 'number') {
          activation = regionData
        }
        return [id, activation]
      })
    ) as Record<RegionId, number>

    return {
      regions,
      wave: currentState.wave || { type: 'alpha', freqHz: 10, amp: 50 },
      updatedAt: currentState.updatedAt || new Date().toISOString(),
    }
  }, [currentState])

  // Helper to update state from BrainState
  const updateStateFromBrainState = useCallback((brainState: BrainState) => {
    const signals = calculateSignals(brainState)
    const waveData = generateWaveformSamples(brainState.wave, 200)

    const extendedState: ExtendedBrainState = {
      ...brainState,
      regions: Object.fromEntries(
        Object.entries(BRAIN_REGIONS).map(([id, region]) => {
          const activation = brainState.regions[id as RegionId] || 0
          // Store activity as 0-1 value for BrainMap color intensity
          const activity = Math.min(1, Math.max(0, activation / 100))
          return [
            id,
            {
              x: region.x,
              y: region.y,
              label: region.label,
              active: activation > 0,
              activity, // Store 0-1 value for color intensity
            },
          ]
        })
      ) as Record<string, { x: number; y: number; label: string; active?: boolean; activity?: number }>,
      waveInfo: {
        data: waveData,
        frequency: brainState.wave.freqHz,
        amplitude: brainState.wave.amp,
      },
      signals,
    }
    setCurrentState(extendedState)
  }, [])

  // Set up brain state accessors for tools IMMEDIATELY
  // This must happen synchronously before any tools can be called
  // Use useMemo to ensure it's set up on first render
  useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:260',message:'setBrainStateAccessors CALLED (useMemo)',data:{hasGetBrainState:!!getBrainState, hasUpdateState:!!updateStateFromBrainState, hasFetchSessions:!!fetchSessions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setBrainStateAccessors(getBrainState, updateStateFromBrainState, fetchSessions)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:264',message:'setBrainStateAccessors COMPLETE (useMemo)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }, [getBrainState, updateStateFromBrainState, fetchSessions])

  // Also update in useEffect as a safety net
  useEffect(() => {
    setBrainStateAccessors(getBrainState, updateStateFromBrainState, fetchSessions)
  }, [getBrainState, updateStateFromBrainState, fetchSessions])

  // Listen to tool execution events for immediate UI updates
  useEffect(() => {
    if (!sessionReady) return

    const unsubscribeStimulate = toolEvents.on('stimulate_region', () => {
      // State is already updated by the tool, just trigger re-render
      // The BrainMap and Waveform will update automatically via props
    })

    const unsubscribeSave = toolEvents.on('save_session', () => {
      // Refresh sessions list
      fetchSessions()
    })

    const unsubscribeLoad = toolEvents.on('load_session', () => {
      // State is already updated by the tool, just trigger re-render
      fetchSessions()
    })

    return () => {
      unsubscribeStimulate()
      unsubscribeSave()
      unsubscribeLoad()
    }
  }, [sessionReady, fetchSessions])

  const loadSession = useCallback(async (sessionId: string) => {
    if (!supabase) return

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
        return
      }

      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/auth')
          return
        }
        throw new Error('Failed to load session')
      }

      const { session: sessionData } = await response.json()
      if (sessionData?.state) {
        const loadedState = sessionData.state as BrainState
        updateStateFromBrainState(loadedState)
        setSelectedSessionId(sessionId)
      }
    } catch (error) {
      // Error loading session - user will see it in UI
    }
  }, [updateStateFromBrainState, router])

  const saveSession = useCallback(async (title: string) => {
    if (!supabase) return

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session || !session.access_token) {
        return
      }

      // Extract BrainState from current state
      const stateToSave: BrainState = {
        regions: Object.fromEntries(
          Object.entries(BRAIN_REGIONS).map(([id]) => {
            const regionData = currentState.regions?.[id]
            let activation = 0
            if (regionData && typeof regionData === 'object' && 'active' in regionData) {
              activation = regionData.active ? 50 : 0
            } else if (typeof regionData === 'number') {
              activation = regionData
            }
            return [id, activation]
          })
        ) as Record<RegionId, number>,
        wave: currentState.wave || { type: 'alpha', freqHz: 10, amp: 50 },
        updatedAt: new Date().toISOString(),
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          state: stateToSave,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/auth')
          return
        }
        throw new Error('Failed to save session')
      }

      await fetchSessions()
    } catch (error) {
      // Silently fail - user will see error in UI if needed
    }
  }, [currentState, fetchSessions, router])

  useEffect(() => {
    if (!loading && sessionReady && supabase) {
      // Only fetch sessions when session is ready and we have access token
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          fetchSessions()
        }
      })
    }
  }, [loading, sessionReady, fetchSessions, supabase])

  useEffect(() => {
    if (!thread || loading) return

    const currentMessageCount = thread.messages.length
    const previousMessageCount = previousMessageCountRef.current

    if (currentMessageCount > previousMessageCount) {
      const lastMessage = thread.messages[thread.messages.length - 1]
      if (lastMessage?.role === 'assistant') {
        // Refresh sessions list after tool execution
        fetchSessions()
        // Update state accessors in case state changed
        if (sessionReady) {
          setBrainStateAccessors(getBrainState, updateStateFromBrainState)
        }
      }
    }

    previousMessageCountRef.current = currentMessageCount
  }, [thread?.messages, loading, fetchSessions, sessionReady, getBrainState, updateStateFromBrainState])

  const handleRegionClick = (regionId: string) => {
    setCurrentState((prev) => {
      const regionKey = regionId as RegionId
      // Extract numeric activation from UI state
      const regionData = prev.regions?.[regionKey]
      let currentActivation = 0
      if (regionData && typeof regionData === 'object' && 'active' in regionData) {
        currentActivation = regionData.active ? 50 : 0
      } else if (typeof regionData === 'number') {
        currentActivation = regionData
      }
      const newActivation = currentActivation > 0 ? 0 : 50 // Toggle between 0 and 50

      // Build updated regions map from BrainState format
      const updatedRegions: Record<RegionId, number> = {
        frontal: 0,
        parietal: 0,
        occipital: 0,
        temporal: 0,
        cerebellum: 0,
        brainstem: 0,
      }
      // Preserve existing activations
      Object.entries(BRAIN_REGIONS).forEach(([id]) => {
        const existingData = prev.regions?.[id]
        if (id === regionKey) {
          updatedRegions[id as RegionId] = newActivation
        } else if (existingData && typeof existingData === 'object' && 'active' in existingData) {
          updatedRegions[id as RegionId] = existingData.active ? 50 : 0
        } else if (typeof existingData === 'number') {
          updatedRegions[id as RegionId] = existingData
        }
      })

      const updatedWave = {
        ...prev.wave,
        type: prev.wave?.type || 'alpha',
        freqHz: prev.wave?.freqHz || 10,
        amp: prev.wave?.amp || 50,
      }

      const brainState: BrainState = {
        regions: updatedRegions,
        wave: updatedWave,
        updatedAt: new Date().toISOString(),
      }

      const signals = calculateSignals(brainState)
      const waveData = generateWaveformSamples(updatedWave, 200)

      return {
        ...brainState,
        regions: Object.fromEntries(
          Object.entries(BRAIN_REGIONS).map(([id, region]) => [
            id,
            {
              x: region.x,
              y: region.y,
              label: region.label,
              active: updatedRegions[id as RegionId] > 0,
            },
          ])
        ) as Record<string, { x: number; y: number; label: string; active?: boolean }>,
        waveInfo: { data: waveData, frequency: updatedWave.freqHz, amplitude: updatedWave.amp },
        signals,
      }
    })
  }

  if (!supabase) {
    return <SupabaseError />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--nl-bg-gradient)' }}>
      <Navbar />
      <main className="h-[calc(100vh-72px)] px-6 py-6">
        <div className="max-w-[1400px] mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6 h-full min-w-0">
            {/* Left Column - Simulation Panels (60-65%) */}
            <div className="flex flex-col gap-6 overflow-y-auto">
              {/* A) Brain Activity Map Card */}
              <div className="nl-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-100">Brain Activity Map</h2>
                      <p className="text-sm text-neutral-400 mt-0.5">Click regions to view details.</p>
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="nl-pill bg-white/10 border border-white/30 text-white">
                    {(currentState.wave?.type?.toUpperCase() || 'ALPHA')} • {currentState.waveInfo?.frequency?.toFixed(1) || '10.0'}Hz
                  </div>
                </div>
                <BrainMap
                  regions={currentState.regions || {}}
                  onRegionClick={handleRegionClick}
                />
              </div>

              {/* B) Tabs Row */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('waveform')}
                  className={`nl-pill px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'waveform'
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-neutral-800/30 border-neutral-700/30 text-neutral-400 hover:text-neutral-300'
                    }`}
                >
                  EEG Waveform
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`nl-pill px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'analysis'
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-neutral-800/30 border-neutral-700/30 text-neutral-400 hover:text-neutral-300'
                    }`}
                >
                  Signal Analysis
                </button>
              </div>

              {/* C) Waveform Card */}
              {activeTab === 'waveform' && (
                <div className="nl-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      <span className="text-sm font-semibold text-neutral-100">
                        LIVE | {(currentState.wave?.type?.toUpperCase() || 'ALPHA')} WAVE
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-neutral-400">
                      {currentState.waveInfo?.frequency?.toFixed(1) || '10.0'} Hz  {currentState.waveInfo?.amplitude || '50'}% Amp
                    </div>
                  </div>
                  <Waveform
                    data={currentState.waveInfo?.data}
                    frequency={currentState.waveInfo?.frequency}
                    amplitude={currentState.waveInfo?.amplitude}
                  />
                </div>
              )}

              {/* Signal Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="nl-card p-6">
                  <SignalMeters 
                    signals={currentState.signals} 
                    wave={currentState.wave}
                  />
                </div>
              )}

              {/* D) Simulation Controls Card */}
              <SimulationControls 
                currentState={currentState}
                onStimulate={async (region, intensity, frequency) => {
                  const brainState = getBrainState()
                  const regionId = region as RegionId
                  const currentActivation = brainState.regions[regionId] || 0
                  const newActivation = stimulateRegion(currentActivation, intensity * 100, frequency)
                  
                  // Calculate dominant wave type based on frequency
                  const waveType = computeDominantWave(frequency)
                  
                  const updatedState: BrainState = {
                    ...brainState,
                    regions: {
                      ...brainState.regions,
                      [regionId]: newActivation,
                    },
                    wave: {
                      type: waveType,
                      freqHz: frequency,
                      amp: intensity * 100,
                    },
                    updatedAt: new Date().toISOString(),
                  }
                  
                  // Update state which will trigger waveform update
                  updateStateFromBrainState(updatedState)
                  
                  // Force waveform to regenerate with new frequency
                  // The Waveform component will pick up the new frequency from currentState.waveInfo
                }}
                onSaveSession={async (title) => {
                  const brainState = getBrainState()
                  if (!supabase) return
                  
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) return
                  
                  const response = await fetch('/api/sessions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      title: title || 'Untitled Session',
                      state: brainState,
                    }),
                  })
                  
                  if (response.ok) {
                    fetchSessions()
                  }
                }}
                onReset={() => {
                  const defaultState: BrainState = {
                    regions: Object.fromEntries(
                      Object.keys(BRAIN_REGIONS).map(id => [id, 0])
                    ) as Record<RegionId, number>,
                    wave: { type: 'alpha', freqHz: 10, amp: 50 },
                    updatedAt: new Date().toISOString(),
                  }
                  updateStateFromBrainState(defaultState)
                }}
              />

              {/* Sessions List */}
              <div className="nl-card overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800/60">
                  <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Sessions</h3>
                </div>
                {sessionsError ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className="text-red-400 mb-4 text-sm">{sessionsError}</p>
                      <button
                        onClick={fetchSessions}
                        className="nl-pill bg-white/20 border-white/40 text-white hover:bg-white/30"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <SessionsList
                    sessions={sessions}
                    selectedSessionId={selectedSessionId}
                    onSelectSession={loadSession}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Neural Assistant (35-40%) */}
            <div className="neurodesk-chat nl-card flex flex-col h-[calc(100vh-72px)] min-w-0 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-neutral-800/60 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h2 className="text-lg font-bold text-neutral-100">Neural Assistant</h2>
                  </div>
                  <div className="nl-pill bg-neutral-800/50 border-neutral-700/50 text-neutral-400 text-xs font-semibold">
                    SIMULATION
                  </div>
                </div>

                {/* Disclaimer Bar */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/30">
                  <svg className="w-4 h-4 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-white/90 leading-relaxed">
                    This is an educational simulation only. No real neural data is being processed. Enable a backend to unlock AI-powered analysis.
                  </p>
                </div>
              </div>

              {/* Chat Messages Area - flex-1 min-h-0 for proper scrolling */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ScrollableMessageContainer className="flex-1 min-h-0 p-4">
                  <ThreadContent variant="default" className="h-full">
                    <ThreadContentMessages className="h-full" />
                  </ThreadContent>
                </ScrollableMessageContainer>

                {/* Streaming Error Display */}
                {streamingError && (
                  <div className="px-4 pb-2">
                    <StreamingError
                      error={streamingError}
                      onRetry={() => setStreamingError(null)}
                    />
                  </div>
                )}

                {/* Input Bar - Pinned to bottom */}
                <div className="p-4 border-t border-neutral-800/60 flex-shrink-0">
                  <MessageInput>
                    <MessageInputTextarea placeholder="Ask about neural patterns..." />
                    <MessageInputToolbar>
                      <MessageInputFileButton />
                      <MessageInputMcpPromptButton />
                      <MessageInputMcpResourceButton />
                      <MessageInputSubmitButton />
                    </MessageInputToolbar>
                    <MessageInputError />
                  </MessageInput>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AppPage() {
  const userContextKey = useUserContextKey('neurodesk')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Follow official Tambo template pattern: use NEXT_PUBLIC_TAMBO_API_KEY directly
  // See: https://docs.tambo.co/getting-started/integrate
  const tamboApiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY
  const tamboUrl = process.env.NEXT_PUBLIC_TAMBO_API_URL // Optional - only for custom endpoints

  // Log configuration in development - right before client creation
  if (process.env.NODE_ENV === 'development') {
    console.log('[Tambo Config] Client configuration (before TamboAI instantiation):', {
      hasApiKey: !!tamboApiKey,
      apiKeyLength: tamboApiKey?.length || 0,
      apiKeyPreview: tamboApiKey ? `${tamboApiKey.substring(0, 8)}...` : '[MISSING]',
      tamboUrl: tamboUrl || '[NOT SET - using default]',
      hasSupabase: !!supabaseUrl && !!supabaseAnonKey,
    })
    
    if (!tamboApiKey) {
      console.error('[Tambo Config] ERROR: NEXT_PUBLIC_TAMBO_API_KEY is missing.')
      console.error('[Tambo Config] Set NEXT_PUBLIC_TAMBO_API_KEY in .env.local')
      console.error('[Tambo Config] Get your API key from: https://tambo.co/dashboard')
    } else {
      // Validate URL if provided
      if (tamboUrl) {
        try {
          new URL(tamboUrl)
          console.log('[Tambo Config] ✓ Custom Tambo URL is valid:', tamboUrl)
        } catch (urlError) {
          console.error('[Tambo Config] ERROR: Invalid tamboUrl format:', tamboUrl)
        }
      } else {
        console.log('[Tambo Config] Using default Tambo API URL (https://api.tambo.co)')
      }
    }
  }

  const missingVars = {
    tambo: !tamboApiKey,
    supabase: !supabaseUrl || !supabaseAnonKey,
  }

  if (missingVars.tambo || missingVars.supabase) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <SetupRequired missingVars={missingVars} />
      </div>
    )
  }

  // Only include MCP servers if explicitly configured (skip default demo server to avoid conflicts)
  const mcpServers = process.env.NEXT_PUBLIC_MCP_DEMO_URL
    ? [{ url: MCP_DEMO_URL, transport: MCPTransport.HTTP as const }]
    : []

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:747',message:'BEFORE_TAMBO_PROVIDER',data:{hasApiKey:!!tamboApiKey, toolsCount:tamboTools.length, toolNames:tamboTools.map(t=>t.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  return (
    <ErrorBoundary>
      <TamboProvider
        apiKey={tamboApiKey}
        tamboUrl={tamboUrl}
        tools={tamboTools}
        mcpServers={mcpServers}
        contextKey={userContextKey}
      >
        <AppContent />
      </TamboProvider>
    </ErrorBoundary>
  )
}
