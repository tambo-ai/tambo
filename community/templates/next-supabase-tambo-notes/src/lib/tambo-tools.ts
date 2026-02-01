import { TamboTool } from '@tambo-ai/react'
import { z } from 'zod'
import { supabase } from './supabaseClient'
import { 
  stimulateRegion, 
  computeDominantWave, 
  generateWaveformSamples,
  calculateSignals,
  type BrainState,
  type RegionId
} from './brain/sim'
import { BRAIN_REGIONS } from './brain/regions'
import { toolEvents } from './tool-events'

// Global state access - will be set by the app component
let currentBrainStateGetter: (() => BrainState) | null = null
let brainStateUpdater: ((state: BrainState) => void) | null = null
let refreshSessionsCallback: (() => void) | null = null
let isInitialized = false

export function setBrainStateAccessors(
  getter: () => BrainState,
  updater: (state: BrainState) => void,
  refreshSessions?: () => void
) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:22',message:'setBrainStateAccessors FUNCTION CALLED',data:{hasGetter:!!getter, hasUpdater:!!updater, hasRefreshSessions:!!refreshSessions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  currentBrainStateGetter = getter
  brainStateUpdater = updater
  refreshSessionsCallback = refreshSessions || null
  isInitialized = true
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:30',message:'setBrainStateAccessors COMPLETE',data:{isInitialized:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
}

function ensureInitialized(): boolean {
  if (!isInitialized || !currentBrainStateGetter || !brainStateUpdater) {
    console.warn('[tambo-tools] Brain state accessors not initialized. The application may still be loading.')
    return false
  }
  return true
}

// Safe wrapper to get brain state - returns null if not initialized
function safeGetBrainState(): BrainState | null {
  try {
    if (!currentBrainStateGetter) return null
    return currentBrainStateGetter()
  } catch {
    return null
  }
}

// Safe wrapper to update brain state - returns false if failed
function safeUpdateBrainState(state: BrainState): boolean {
  try {
    if (!brainStateUpdater) return false
    brainStateUpdater(state)
    return true
  } catch {
    return false
  }
}

/**
 * Helper to ensure a value is JSON-serializable (no functions, dates, undefined, etc.)
 */
function ensureSerializable(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(ensureSerializable)
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        result[key] = ensureSerializable(val)
      }
    }
    return result
  }
  return String(value)
}

/**
 * Tool 1: stimulate_region
 * Stimulates a brain region with intensity and frequency
 */
export const stimulateRegionTool: TamboTool = {
  name: 'stimulate_region',
  description: 'Use when user asks to stimulate, activate, or increase activity in a brain region. Accepts region names like "frontal" (also called "motor" or "motor cortex"), "parietal", "occipital", "temporal", "cerebellum", or "brainstem". Updates the BrainState simulation with new activation levels and returns a summary of changes. This is a simulation tool only - not for medical diagnosis.',
  tool: async ({ region, intensity, frequency }) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:94',message:'stimulate_region ENTRY',data:{region, intensity, frequency, isInitialized, hasGetter:!!currentBrainStateGetter, hasUpdater:!!brainStateUpdater},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Wrap entire function in try-catch to prevent any uncaught errors
    try {
      // Validate inputs first
      if (!region || typeof region !== 'string') {
        console.error('[stimulate_region] Invalid region input:', region)
        return {
          region: 'unknown',
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: '10.0',
          intensity: '0.0',
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }
      if (typeof intensity !== 'number' || isNaN(intensity)) {
        console.error('[stimulate_region] Invalid intensity input:', intensity)
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: '10.0',
          intensity: '0.0',
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }
      if (typeof frequency !== 'number' || isNaN(frequency)) {
        console.error('[stimulate_region] Invalid frequency input:', frequency)
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: '10.0',
          intensity: '0.0',
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }

      // Check initialization - return valid object instead of throwing
      if (!isInitialized || !currentBrainStateGetter || !brainStateUpdater) {
        console.warn('[stimulate_region] Brain state accessors not initialized yet')
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: String(frequency || 10.0),
          intensity: String(intensity || 0.0),
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }

      // Normalize region name (handle "motor" -> "frontal")
      let normalizedRegion = region.toLowerCase().trim()
      if (normalizedRegion === 'motor' || normalizedRegion === 'motor cortex' || normalizedRegion === 'motor region') {
        normalizedRegion = 'frontal'
      }
      
      // Validate region - return valid object instead of throwing
      if (!BRAIN_REGIONS[normalizedRegion as RegionId]) {
        console.error('[stimulate_region] Invalid region:', region)
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: String(frequency || 10.0),
          intensity: String(intensity || 0.0),
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }
      
      const regionId = normalizedRegion as RegionId

      // Clamp values
      const clampedIntensity = Math.max(0.1, Math.min(1.0, Number(intensity)))
      const clampedFrequency = Math.max(0.5, Math.min(60, Number(frequency)))
      
      // Convert intensity from 0.1-1.0 to 0-100 scale
      const intensityPercent = clampedIntensity * 100

      // Get current state safely
      let currentState: BrainState
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:185',message:'BEFORE getBrainState',data:{hasGetter:!!currentBrainStateGetter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        currentState = currentBrainStateGetter()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:189',message:'AFTER getBrainState',data:{hasState:!!currentState, regionsCount:Object.keys(currentState?.regions||{}).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (!currentState || !currentState.regions) {
          console.warn('[stimulate_region] Invalid brain state, using defaults')
          currentState = {
            regions: {} as Record<RegionId, number>,
            wave: { type: 'alpha', freqHz: 10, amp: 50 },
            updatedAt: new Date().toISOString(),
          }
        }
      } catch (stateError) {
        console.error('[stimulate_region] Error getting brain state:', stateError)
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: String(clampedFrequency),
          intensity: String(clampedIntensity),
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }
      const currentActivation = currentState.regions[regionId] || 0

      // Stimulate the region
      const newActivation = stimulateRegion(currentActivation, intensityPercent, clampedFrequency)

      // Update wave based on frequency
      const dominantWave = computeDominantWave(clampedFrequency)
      const newWave = {
        type: dominantWave,
        freqHz: clampedFrequency,
        amp: intensityPercent,
      }

      // Create updated state
      const updatedState: BrainState = {
        regions: {
          ...currentState.regions,
          [regionId]: newActivation,
        },
        wave: newWave,
        updatedAt: new Date().toISOString(),
      }

      // Update the state safely
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:247',message:'BEFORE updateBrainState',data:{hasUpdater:!!brainStateUpdater, newActivation, regionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        brainStateUpdater(updatedState)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:250',message:'AFTER updateBrainState',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (updateError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:253',message:'updateBrainState ERROR',data:{error:String(updateError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('[stimulate_region] Error updating brain state:', updateError)
        // Continue anyway - return the result even if update failed
      }

      // Generate summary
      const signals = calculateSignals(updatedState)
      const summary = {
        region: regionId,
        previousActivation: Math.round(currentActivation),
        newActivation: Math.round(newActivation),
        change: Math.round(newActivation - currentActivation),
        waveType: dominantWave,
        frequency: clampedFrequency.toFixed(1),
        intensity: clampedIntensity.toFixed(2),
        signals: {
          Alpha: Math.round(signals.Alpha),
          Beta: Math.round(signals.Beta),
          Gamma: Math.round(signals.Gamma),
          Theta: Math.round(signals.Theta),
        },
      }

      // Emit event for UI updates
      toolEvents.emit({
        type: 'stimulate_region',
        toolName: 'stimulate_region',
        result: summary,
        timestamp: Date.now(),
      })

      // Validate output matches schema - return valid object instead of throwing
      if (!summary || typeof summary !== 'object') {
        console.error('[stimulate_region] Invalid summary format:', summary)
        return {
          region: String(region),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: String(clampedFrequency),
          intensity: String(clampedIntensity),
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }

      // Ensure all required fields are present and properly typed
      const validatedOutput = {
        region: String(summary.region || region || 'unknown'),
        previousActivation: Number(summary.previousActivation || 0),
        newActivation: Number(summary.newActivation || 0),
        change: Number(summary.change || 0),
        waveType: String(summary.waveType || 'alpha'),
        frequency: String(summary.frequency || '10.0'),
        intensity: String(summary.intensity || '0.0'),
        signals: {
          Alpha: Number(summary.signals?.Alpha || 0),
          Beta: Number(summary.signals?.Beta || 0),
          Gamma: Number(summary.signals?.Gamma || 0),
          Theta: Number(summary.signals?.Theta || 0),
        },
      }

      // Ensure output is fully serializable (no functions, dates, etc.)
      const serializableOutput = ensureSerializable(validatedOutput) as typeof validatedOutput
      
      // Final validation
      try {
        JSON.stringify(serializableOutput)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:304',message:'stimulate_region SUCCESS',data:{region:serializableOutput.region, serializable:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (serializeError) {
        console.error('[stimulate_region] Final serialization check failed:', serializeError)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:307',message:'stimulate_region SERIALIZATION_ERROR',data:{error:String(serializeError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return {
          region: String(region || 'unknown'),
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: '10.0',
          intensity: '0.0',
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }

      return serializableOutput
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[stimulate_region] Error:', errorMessage, error)
      // Return valid schema-compliant object even on error
      const errorOutput = {
        region: String(region || 'unknown'),
        previousActivation: 0,
        newActivation: 0,
        change: 0,
        waveType: 'alpha',
        frequency: '10.0',
        intensity: '0.0',
        signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
      }
      // Ensure error output is also serializable
      try {
        JSON.stringify(errorOutput)
        return errorOutput
      } catch {
        // Last resort: return minimal valid object
        return {
          region: 'unknown',
          previousActivation: 0,
          newActivation: 0,
          change: 0,
          waveType: 'alpha',
          frequency: '10.0',
          intensity: '0.0',
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        }
      }
    }
  },
  inputSchema: z.object({
    region: z.enum(['frontal', 'parietal', 'occipital', 'temporal', 'cerebellum', 'brainstem']).describe('The brain region to stimulate'),
    intensity: z.number().min(0.1).max(1.0).describe('Stimulation intensity from 0.1 (low) to 1.0 (high)'),
    frequency: z.number().min(0.5).max(60).describe('Stimulation frequency in Hz from 0.5 to 60'),
  }),
  outputSchema: z.object({
    region: z.string(),
    previousActivation: z.number(),
    newActivation: z.number(),
    change: z.number(),
    waveType: z.string(),
    frequency: z.string(),
    intensity: z.string(),
    signals: z.object({
      Alpha: z.number(),
      Beta: z.number(),
      Gamma: z.number(),
      Theta: z.number(),
    }),
  }),
}

/**
 * Tool 2: analyze_patterns
 * Analyzes current BrainState and returns insights
 */
export const analyzePatternsTool: TamboTool = {
  name: 'analyze_patterns',
  description: 'Use when user asks to analyze, examine, or get insights about the current brain state patterns. Returns a summary or anomaly detection based on the current BrainState. IMPORTANT: This is a simulation tool only - not for medical diagnosis.',
  tool: async ({ mode = 'summary' }) => {
    try {
      // Check initialization - return valid object instead of throwing
      if (!isInitialized || !currentBrainStateGetter) {
        console.warn('[analyze_patterns] Brain state accessors not initialized yet')
        return {
          mode: 'summary' as const,
          totalRegions: 0,
          averageActivation: 0,
          maxActivation: 0,
          minActivation: 0,
          mostActiveRegion: 'unknown',
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }

      const currentState = currentBrainStateGetter()
      if (!currentState || !currentState.regions || !currentState.wave) {
        console.warn('[analyze_patterns] Invalid brain state')
        return {
          mode: 'summary' as const,
          totalRegions: 0,
          averageActivation: 0,
          maxActivation: 0,
          minActivation: 0,
          mostActiveRegion: 'unknown',
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }
      const { regions, wave } = currentState

      // Calculate statistics
      const activations = Object.values(regions)
      if (activations.length === 0) {
        console.warn('[analyze_patterns] No brain regions available')
        return {
          mode: 'summary' as const,
          totalRegions: 0,
          averageActivation: 0,
          maxActivation: 0,
          minActivation: 0,
          mostActiveRegion: 'unknown',
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }
      
      const totalActivation = activations.reduce((sum, val) => sum + val, 0)
      const avgActivation = totalActivation / activations.length
      const maxActivation = Math.max(...activations)
      const minActivation = Math.min(...activations)
      const maxRegion = Object.entries(regions).reduce((a, b) => (regions[a[0] as RegionId] > regions[b[0] as RegionId] ? a : b))[0]

      // Calculate signals
      const signals = calculateSignals(currentState)

    if (mode === 'anomaly') {
      // Anomaly detection
      const anomalies: string[] = []
      
      // Check for unusually high activation
      if (maxActivation > 80) {
        anomalies.push(`Very high activation detected in ${maxRegion} region (${Math.round(maxActivation)}%)`)
      }
      
      // Check for unusually low activation
      if (minActivation < 10 && avgActivation < 20) {
        anomalies.push('Overall low activation detected across all regions')
      }
      
      // Check for frequency anomalies
      if (wave.freqHz > 50) {
        anomalies.push(`Unusually high frequency detected (${wave.freqHz.toFixed(1)} Hz) - gamma wave activity`)
      }
      
      if (wave.freqHz < 2) {
        anomalies.push(`Unusually low frequency detected (${wave.freqHz.toFixed(1)} Hz) - delta wave activity`)
      }

      // Check for signal imbalances
      const signalVariance = Object.values(signals).reduce((sum, val) => {
        const mean = Object.values(signals).reduce((s, v) => s + v, 0) / 4
        return sum + Math.pow(val - mean, 2)
      }, 0) / 4
      
      if (signalVariance > 1000) {
        anomalies.push('Significant signal imbalance detected between frequency bands')
      }

      const anomalyResult = {
        mode: 'anomaly' as const,
        hasAnomalies: anomalies.length > 0,
        anomalies: anomalies.length > 0 ? anomalies : ['No anomalies detected - patterns appear normal'],
        summary: `Analyzed ${Object.keys(regions).length} regions with average activation of ${Math.round(avgActivation)}%`,
        timestamp: new Date().toISOString(),
        disclaimer: 'This is a simulation only - not for medical diagnosis',
      }
      
      // Ensure fully serializable
      const serializableAnomaly = ensureSerializable(anomalyResult) as typeof anomalyResult
      
      try {
        JSON.stringify(serializableAnomaly)
        return serializableAnomaly
      } catch (serializeError) {
        console.error('[analyze_patterns] Serialization error:', serializeError)
        return {
          mode: 'summary' as const,
          totalRegions: Object.keys(regions).length,
          averageActivation: Math.round(avgActivation),
          maxActivation: Math.round(maxActivation),
          minActivation: Math.round(minActivation),
          mostActiveRegion: String(maxRegion || 'unknown'),
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }
    } else {
      // Summary mode
      const summaryResult = {
        mode: 'summary' as const,
        totalRegions: Object.keys(regions).length,
        averageActivation: Math.round(avgActivation),
        maxActivation: Math.round(maxActivation),
        minActivation: Math.round(minActivation),
        mostActiveRegion: String(maxRegion || 'unknown'),
        currentWave: {
          type: String(wave.type || 'alpha'),
          frequency: String(wave.freqHz?.toFixed(1) || '0.0'),
          amplitude: Number(Math.round(wave.amp || 0)),
        },
        signals: {
          Alpha: Number(Math.round(signals.Alpha || 0)),
          Beta: Number(Math.round(signals.Beta || 0)),
          Gamma: Number(Math.round(signals.Gamma || 0)),
          Theta: Number(Math.round(signals.Theta || 0)),
        },
        timestamp: new Date().toISOString(),
        disclaimer: 'This is a simulation only - not for medical diagnosis',
      }
      
      // Ensure fully serializable
      const serializableSummary = ensureSerializable(summaryResult) as typeof summaryResult
      
      try {
        JSON.stringify(serializableSummary)
        return serializableSummary
      } catch (serializeError) {
        console.error('[analyze_patterns] Serialization error:', serializeError)
        return {
          mode: 'summary' as const,
          totalRegions: 0,
          averageActivation: 0,
          maxActivation: 0,
          minActivation: 0,
          mostActiveRegion: 'unknown',
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }
    }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[analyze_patterns] Error:', errorMessage, error)
      // Return valid schema-compliant object even on error
      const errorResult = {
        mode: 'summary' as const,
        totalRegions: 0,
        averageActivation: 0,
        maxActivation: 0,
        minActivation: 0,
        mostActiveRegion: 'unknown',
        currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
        signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
        timestamp: new Date().toISOString(),
        disclaimer: 'This is a simulation only - not for medical diagnosis',
      }
      
      try {
        JSON.stringify(errorResult)
        return errorResult
      } catch {
        // Last resort fallback
        return {
          mode: 'summary',
          totalRegions: 0,
          averageActivation: 0,
          maxActivation: 0,
          minActivation: 0,
          mostActiveRegion: 'unknown',
          currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
          signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          timestamp: new Date().toISOString(),
          disclaimer: 'This is a simulation only - not for medical diagnosis',
        }
      }
    }
  },
  inputSchema: z.object({
    mode: z.enum(['summary', 'anomaly']).optional().describe('Analysis mode: "summary" for overview or "anomaly" for anomaly detection'),
  }),
  outputSchema: z.object({
    mode: z.string(),
    disclaimer: z.string(),
    timestamp: z.string(),
  }).passthrough(), // Allow additional fields
}

/**
 * Tool 3: save_session
 * Saves current BrainState to Supabase
 */
export const saveSessionTool: TamboTool = {
  name: 'save_session',
  description: 'Use when user asks to save, store, remember, or create a session with phrases like "save this as [title]", "remember this state", or "store this session". Saves the current BrainState to the database and returns the session ID and timestamp.',
  tool: async ({ title }) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }
      
      if (!ensureInitialized()) {
        console.warn('[save_session] Brain state accessors not initialized')
        return {
          sessionId: '',
          title: String(title || 'Untitled'),
          timestamp: new Date().toISOString(),
          error: 'Brain state not initialized. Please wait a moment and try again.',
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const currentState = currentBrainStateGetter()

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title || `Session ${new Date().toLocaleString()}`,
          state: currentState,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Unknown error'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        console.error('[save_session] Failed to save:', errorMessage)
        return {
          id: '',
          title: String(title || 'Failed Session'),
          timestamp: new Date().toISOString(),
          message: `Failed to save session: ${errorMessage}`,
        }
      }

      const { session: sessionData } = await response.json()
      if (!sessionData) {
        console.error('[save_session] Invalid response from server')
        return {
          id: '',
          title: String(title || 'Failed Session'),
          timestamp: new Date().toISOString(),
          message: 'Invalid response from server',
        }
      }

      const result = {
        id: sessionData.id,
        title: sessionData.title,
        timestamp: sessionData.created_at,
        message: `Session "${sessionData.title}" saved successfully`,
      }

      // Emit event and refresh sessions
      toolEvents.emit({
        type: 'save_session',
        toolName: 'save_session',
        result,
        timestamp: Date.now(),
      })
      
      if (refreshSessionsCallback) {
        refreshSessionsCallback()
      }

      // Validate output
      if (!result || !result.id || !result.title) {
        console.error('[save_session] Invalid session save result')
        return {
          id: '',
          title: String(title || 'Untitled Session'),
          timestamp: new Date().toISOString(),
          message: 'Invalid session save result',
        }
      }

      // Ensure all fields are properly typed and serializable
      const validatedResult = {
        id: String(result.id || ''),
        title: String(result.title || title || 'Untitled Session'),
        timestamp: String(result.timestamp || new Date().toISOString()),
        message: String(result.message || 'Session saved'),
      }

      // Ensure fully serializable
      const serializableResult = ensureSerializable(validatedResult) as typeof validatedResult
      
      try {
        JSON.stringify(serializableResult)
        return serializableResult
      } catch (serializeError) {
        console.error('[save_session] Serialization error:', serializeError)
        return {
          id: '',
          title: String(title || 'Untitled Session'),
          timestamp: new Date().toISOString(),
          message: 'Failed to serialize save result',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[save_session] Error:', errorMessage, error)
      // Return valid schema-compliant object even on error
      const errorResult = {
        id: '',
        title: String(title || 'Failed Session'),
        timestamp: new Date().toISOString(),
        message: `Failed to save session: ${errorMessage}`,
      }
      
      try {
        JSON.stringify(errorResult)
        return errorResult
      } catch {
        // Last resort fallback
        return {
          id: '',
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: 'Failed to save session',
        }
      }
    }
  },
  inputSchema: z.object({
    title: z.string().describe('The title for the session to save'),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    timestamp: z.string(),
    message: z.string(),
    error: z.string().optional(),
  }),
}

/**
 * Tool 4: load_session
 * Loads a session from Supabase and applies BrainState
 */
export const loadSessionTool: TamboTool = {
  name: 'load_session',
  description: 'Use when user asks to load, open, restore, recall, or get a saved session with phrases like "load my last session", "open [session name]", "restore [session id]", or "get my previous session". Retrieves a session from the database and applies its BrainState to the current simulation. If no ID is provided, use the most recent session.',
  tool: async ({ sessionId }) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }
      
      if (!ensureInitialized()) {
        console.warn('[load_session] Brain state accessors not initialized')
        return {
          sessionId: sessionId || '',
          title: '',
          timestamp: new Date().toISOString(),
          error: 'Brain state not initialized. Please wait a moment and try again.',
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      // If sessionId is not provided, try to get the most recent session
      let targetSessionId = sessionId
      
      if (!targetSessionId || targetSessionId.trim() === '') {
        // Try to fetch the most recent session
        const listResponse = await fetch('/api/sessions?limit=1', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: 'include',
        })
        
        if (listResponse.ok) {
          const { sessions } = await listResponse.json()
          if (sessions && sessions.length > 0) {
            targetSessionId = sessions[0].id
          } else {
            console.warn('[load_session] No sessions found')
            return {
              id: '',
              title: 'No Sessions',
              timestamp: new Date().toISOString(),
              message: 'No sessions found. Please save a session first.',
              state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
            }
          }
        } else {
          console.error('[load_session] Failed to fetch sessions list')
          return {
            id: '',
            title: 'Failed Session',
            timestamp: new Date().toISOString(),
            message: 'Failed to fetch sessions list',
            state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
          }
        }
      }
      
      if (!targetSessionId) {
        console.warn('[load_session] Session ID required')
        return {
          id: '',
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: 'Session ID is required. Use "load_session" with a session ID, or save a session first.',
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }

      const url = new URL('/api/sessions', window.location.origin)
      url.searchParams.set('id', targetSessionId)

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.error('[load_session] Session not found:', targetSessionId)
          return {
            id: String(targetSessionId),
            title: 'Not Found',
            timestamp: new Date().toISOString(),
            message: `Session with ID "${targetSessionId}" not found`,
            state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
          }
        }
        let errorMessage = 'Unknown error'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        console.error('[load_session] Failed to load:', errorMessage)
        return {
          id: String(targetSessionId),
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: `Failed to load session: ${errorMessage}`,
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }

      const { session: sessionData } = await response.json()
      
      if (!sessionData) {
        console.error('[load_session] Invalid response from server')
        return {
          id: String(targetSessionId),
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: 'Invalid response from server',
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }
      
      if (!sessionData.state) {
        console.error('[load_session] Session data missing state')
        return {
          id: String(sessionData.id || targetSessionId),
          title: String(sessionData.title || 'Invalid Session'),
          timestamp: String(sessionData.created_at || new Date().toISOString()),
          message: 'Session data is missing state information',
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }

      const loadedState = sessionData.state as BrainState
      
      // Validate loaded state structure
      if (!loadedState.regions || !loadedState.wave) {
        console.error('[load_session] Invalid session state format')
        return {
          id: String(sessionData.id || targetSessionId),
          title: String(sessionData.title || 'Invalid Session'),
          timestamp: String(sessionData.created_at || new Date().toISOString()),
          message: 'Invalid session state format',
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }
      
      // Update the brain state
      brainStateUpdater(loadedState)

      const result = {
        id: sessionData.id,
        title: sessionData.title,
        timestamp: sessionData.created_at,
        message: `Session "${sessionData.title}" loaded successfully`,
        state: {
          regions: Object.keys(loadedState.regions).length,
          waveType: loadedState.wave.type,
          frequency: loadedState.wave.freqHz.toFixed(1),
        },
      }

      // Emit event for UI updates
      toolEvents.emit({
        type: 'load_session',
        toolName: 'load_session',
        result,
        timestamp: Date.now(),
      })

      // Validate output and ensure proper types
      if (!result || !result.id || !result.title) {
        const invalidResult = {
          id: String(sessionId || ''),
          title: 'Invalid Session',
          timestamp: new Date().toISOString(),
          message: 'Invalid session load result',
          state: {
            regions: 0,
            waveType: 'alpha',
            frequency: '0.0',
          },
        }
        
        try {
          JSON.stringify(invalidResult)
          return invalidResult
        } catch (serializeError) {
          console.error('[load_session] Serialization error:', serializeError)
          return {
            id: String(sessionId || ''),
            title: 'Invalid Session',
            timestamp: new Date().toISOString(),
            message: 'Invalid session load result',
            state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
          }
        }
      }

      const validatedResult = {
        id: String(result.id || sessionId || ''),
        title: String(result.title || 'Unknown Session'),
        timestamp: String(result.timestamp || new Date().toISOString()),
        message: String(result.message || 'Session loaded'),
        state: {
          regions: Number(result.state?.regions || 0),
          waveType: String(result.state?.waveType || 'alpha'),
          frequency: String(result.state?.frequency || '0.0'),
        },
      }

      // Ensure fully serializable
      const serializableResult = ensureSerializable(validatedResult) as typeof validatedResult
      
      try {
        JSON.stringify(serializableResult)
        return serializableResult
      } catch (serializeError) {
        console.error('[load_session] Serialization error:', serializeError)
        return {
          id: String(sessionId || ''),
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: 'Failed to serialize load result',
          state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[load_session] Error:', errorMessage, error)
      // Return error as result instead of throwing
      const errorResult = {
        id: String(sessionId || ''),
        title: 'Failed Session',
        timestamp: new Date().toISOString(),
        message: `Failed to load session: ${errorMessage}`,
        state: {
          regions: 0,
          waveType: 'alpha',
          frequency: '0.0',
        },
      }
      
      try {
        JSON.stringify(errorResult)
        return errorResult
      } catch {
        // Last resort fallback
        return {
          id: '',
          title: 'Failed Session',
          timestamp: new Date().toISOString(),
          message: 'Failed to load session',
          state: {
            regions: 0,
            waveType: 'alpha',
            frequency: '0.0',
          },
        }
      }
    }
  },
  inputSchema: z.object({
    sessionId: z.string().optional().describe('The ID of the session to load. If not provided, loads the most recent session.'),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    timestamp: z.string(),
    message: z.string(),
    state: z.object({
      regions: z.number(),
      waveType: z.string(),
      frequency: z.string(),
    }),
    error: z.string().optional(),
  }),
}

/**
 * Wrap a tool to ensure it never throws and always returns a serializable result
 */
function wrapToolSafely(tool: TamboTool): TamboTool {
  const originalTool = tool.tool
  return {
    ...tool,
    tool: async (args: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1083',message:'WRAPPER_TOOL_CALLED',data:{toolName:tool.name, argsKeys:Object.keys(args||{}), hasOriginalTool:!!originalTool},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        const result = await originalTool(args)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1087',message:'WRAPPER_TOOL_SUCCESS',data:{toolName:tool.name, hasResult:!!result, resultType:typeof result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Ensure result is serializable
        try {
          const serialized = ensureSerializable(result) as any
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1092',message:'WRAPPER_SERIALIZATION_SUCCESS',data:{toolName:tool.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return serialized
        } catch (serializeError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1096',message:'WRAPPER_SERIALIZATION_ERROR',data:{toolName:tool.name, error:String(serializeError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          throw new Error(`Tool ${tool.name} returned non-serializable result: ${serializeError}`)
        }
      } catch (error) {
        console.error(`[${tool.name}] Uncaught error in tool:`, error)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1102',message:'WRAPPER_TOOL_ERROR',data:{toolName:tool.name, error:error instanceof Error ? error.message : String(error), errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Return a safe fallback based on tool name
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Return a minimal valid result that matches the tool's output schema
        if (tool.name === 'stimulate_region') {
          return {
            region: 'unknown',
            previousActivation: 0,
            newActivation: 0,
            change: 0,
            waveType: 'alpha',
            frequency: '10.0',
            intensity: '0.0',
            signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
          }
        }
        if (tool.name === 'analyze_patterns') {
          return {
            mode: 'summary',
            totalRegions: 0,
            averageActivation: 0,
            maxActivation: 0,
            minActivation: 0,
            mostActiveRegion: 'unknown',
            currentWave: { type: 'alpha', frequency: '0.0', amplitude: 0 },
            signals: { Alpha: 0, Beta: 0, Gamma: 0, Theta: 0 },
            timestamp: new Date().toISOString(),
            disclaimer: 'This is a simulation only - not for medical diagnosis',
          }
        }
        if (tool.name === 'save_session') {
          return {
            id: '',
            title: 'Failed Session',
            timestamp: new Date().toISOString(),
            message: `Tool error: ${errorMessage}`,
          }
        }
        if (tool.name === 'load_session') {
          return {
            id: '',
            title: 'Failed Session',
            timestamp: new Date().toISOString(),
            message: `Tool error: ${errorMessage}`,
            state: { regions: 0, waveType: 'alpha', frequency: '0.0' },
          }
        }
        // Generic fallback
        return { error: errorMessage, message: 'Tool execution failed' }
      }
    },
  }
}

// Export all tools with safety wrapper
export const tamboTools: TamboTool[] = [
  wrapToolSafely(stimulateRegionTool),
  wrapToolSafely(analyzePatternsTool),
  wrapToolSafely(saveSessionTool),
  wrapToolSafely(loadSessionTool),
]

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7242/ingest/9353c3bf-5155-4137-ab4e-87ab9c69d738',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tambo-tools.ts:1150',message:'TAMBO_TOOLS_EXPORTED',data:{toolsCount:tamboTools.length, toolNames:tamboTools.map(t=>t.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
}
// #endregion
