import type { RegionId } from './regions'

export type WaveType = 'alpha' | 'beta' | 'gamma' | 'theta' | 'delta'

export interface Wave {
  type: WaveType
  freqHz: number
  amp: number
}

export interface BrainState {
  regions: Record<RegionId, number>
  wave: Wave
  updatedAt: string
}

/**
 * Stimulates a brain region with given intensity and frequency
 * Returns the new activation level (0-100)
 */
export function stimulateRegion(
  currentActivation: number,
  intensity: number,
  frequency: number
): number {
  // Clamp intensity to 0-100
  const clampedIntensity = Math.max(0, Math.min(100, intensity))
  
  // Frequency affects how quickly activation changes
  // Higher frequency = faster response
  const frequencyFactor = Math.min(frequency / 10, 1)
  
  // Blend current activation with new intensity based on frequency
  const newActivation = currentActivation * (1 - frequencyFactor * 0.3) + clampedIntensity * (frequencyFactor * 0.3)
  
  // Add some natural decay
  const decay = newActivation * 0.05
  
  return Math.max(0, Math.min(100, newActivation - decay))
}

/**
 * Computes the dominant wave type based on frequency
 */
export function computeDominantWave(frequency: number): WaveType {
  if (frequency < 4) return 'delta'
  if (frequency < 8) return 'theta'
  if (frequency < 13) return 'alpha'
  if (frequency < 30) return 'beta'
  return 'gamma'
}

/**
 * Generates waveform samples for visualization
 */
export function generateWaveformSamples(
  wave: { freqHz: number; amp: number },
  count: number = 200
): number[] {
  const samples: number[] = []
  const timeStep = (2 * Math.PI * wave.freqHz) / count
  
  for (let i = 0; i < count; i++) {
    const t = i * timeStep
    // Generate sine wave with amplitude
    const value = Math.sin(t) * (wave.amp / 100)
    // Normalize to 0-1 range for display
    samples.push((value + 1) / 2)
  }
  
  return samples
}

/**
 * Calculate signal meter values based on wave type and region activations
 */
export function calculateSignals(state: BrainState): {
  Alpha: number
  Beta: number
  Gamma: number
  Theta: number
} {
  const { wave, regions } = state
  
  // Base signals from wave type
  const baseSignals = {
    alpha: wave.type === 'alpha' ? wave.amp : 0,
    beta: wave.type === 'beta' ? wave.amp : 0,
    gamma: wave.type === 'gamma' ? wave.amp : 0,
    theta: wave.type === 'theta' ? wave.amp : 0,
  }
  
  // Add contribution from region activations
  const totalActivation = Object.values(regions).reduce((sum, val) => sum + val, 0)
  const avgActivation = totalActivation / Object.keys(regions).length
  
  // Map activation to signal frequencies
  // Higher activation = more beta/gamma, lower = more alpha/theta
  const highFreqBoost = avgActivation * 0.5
  const lowFreqBoost = (100 - avgActivation) * 0.3
  
  return {
    Alpha: Math.min(100, baseSignals.alpha + (wave.type === 'alpha' ? lowFreqBoost : 0)),
    Beta: Math.min(100, baseSignals.beta + (wave.type === 'beta' ? highFreqBoost : 0)),
    Gamma: Math.min(100, baseSignals.gamma + (wave.type === 'gamma' ? highFreqBoost : 0)),
    Theta: Math.min(100, baseSignals.theta + (wave.type === 'theta' ? lowFreqBoost : 0)),
  }
}
